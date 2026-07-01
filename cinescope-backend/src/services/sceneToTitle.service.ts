import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env";
import { TmdbService } from "./tmdb.service";
import { AppError } from "../utils/appError";
import axios from "axios";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

// ── In-memory filmography cache (1-hour TTL) ──────────────────────────
const filmographyCache = new Map<
  number,
  { data: any[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getCachedFilmography = (personId: number) => {
  const cached = filmographyCache.get(personId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  return null;
};

// ── Helper: parse Gemini JSON (strips markdown fences) ────────────────
const parseGeminiJson = (text = "{}") =>
  JSON.parse(text.trim().replace(/```json|```/g, ""));

// ── Helper: TMDB GET with ISP Bypass ────────────────────────────────
const tmdbGet = async (endpoint: string, params: Record<string, any> = {}) => {
  return await TmdbService.rawGet(endpoint, { params });
};

// ── Fallback API: Groq (Llama 3.2 Vision) ─────────────────────────────
const fallbackIdentifyActors = async (base64Image: string, mimeType: string, prompt: string) => {
  if (!ENV.GROQ_API_KEY) throw new Error("Fallback API key not configured.");
  
  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3.6-27b"
  ];

  let lastError;
  for (const model of models) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      const parsed = parseGeminiJson(content || "{}");
      
      if ((parsed.actors && parsed.actors.length > 0) || parsed.guessedTitle) {
        return parsed;
      }
      lastError = new Error("Model returned empty results");
    } catch (err: any) {
      console.warn(`[SceneToTitle] Fallback API error on ${model}:`, err?.response?.data || err?.message);
      lastError = err;
    }
  }

  return { actors: [], guessedTitle: null, sceneDescription: "Multiple AI models analyzed the scene but could not identify it.", estimatedEra: "Unknown" };
};

// ══════════════════════════════════════════════════════════════════════
// 1. Identify actors from image via Gemini Vision (with Fallback)
// ══════════════════════════════════════════════════════════════════════
export const identifyActorsFromImage = async (
  base64Image: string,
  mimeType = "image/jpeg",
) => {
  const prompt = `You are a movie and TV expert. Analyze this screenshot from a movie or TV show.

TASK 1: Identify ALL recognizable real-world actors or celebrities visible in this image.
For each person you can identify, provide:
- Their REAL NAME (the actor's name, not the character)
- Your confidence level from 0 to 100
- The character they appear to be playing (if you can tell, otherwise "unknown")

TASK 2: If you recognize the exact movie or TV show this scene is from, provide its title. Even if you don't know the actors, you might recognize the show from the setting or costumes.

Return ONLY valid JSON with no additional text:
{
  "actors": [
    { "name": "Actor Full Name", "confidence": 95, "character": "Character Name or unknown" }
  ],
  "guessedTitle": "Exact Movie/Show Title (or null if completely unknown)",
  "sceneDescription": "Brief description of the scene",
  "estimatedEra": "approximate decade or era"
}

If you cannot identify anyone or the title, return empty arrays/null.`;

  let parsed: any = { actors: [] };
  let usedFallback = false;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Image } },
            { text: prompt },
          ],
        },
      ],
    });

    parsed = parseGeminiJson(response.text || "{}");
    
    // Check if Gemini got blocked by safety filters (returned empty array)
    if (!parsed.actors || parsed.actors.length === 0) {
      console.warn("[SceneToTitle] Gemini returned empty array (possible safety block). Triggering fallback...");
      usedFallback = true;
    }
  } catch (err: any) {
    console.warn("[SceneToTitle] Gemini API failed. Triggering fallback...", err?.message || err);
    usedFallback = true;
  }

  // If Gemini failed or was blocked, use Groq
  if (usedFallback) {
    parsed = await fallbackIdentifyActors(base64Image, mimeType, prompt);
  }

  return {
    actors: Array.isArray(parsed.actors) ? parsed.actors : [],
    guessedTitle: parsed.guessedTitle || null,
    sceneDescription: parsed.sceneDescription || "Unable to describe scene",
    estimatedEra: parsed.estimatedEra || "Unknown",
  };
};

// ══════════════════════════════════════════════════════════════════════
// 2. Resolve actor names → TMDB person records
// ══════════════════════════════════════════════════════════════════════
export const resolveActorsToTmdb = async (
  actors: Array<{ name: string; confidence: number; character: string }>,
) => {
  const resolved: Array<{
    name: string;
    confidence: number;
    character: string;
    tmdbId: number;
    profilePath: string;
    knownFor: string;
  }> = [];

  for (const actor of actors) {
    try {
      const data: any = await tmdbGet("/search/person", { query: actor.name });
      const results = data.results || [];

      if (results.length === 0) continue;

      // Pick highest-popularity match to disambiguate common names
      const best = results.reduce(
        (a: any, b: any) => (b.popularity > a.popularity ? b : a),
        results[0],
      );

      const knownForTitle =
        best.known_for?.[0]?.title ||
        best.known_for?.[0]?.name ||
        best.known_for_department ||
        "Acting";

      resolved.push({
        name: actor.name,
        confidence: actor.confidence,
        character: actor.character,
        tmdbId: best.id,
        profilePath: best.profile_path || "",
        knownFor: knownForTitle,
      });
    } catch (err) {
      console.warn(
        `[SceneToTitle] Could not resolve "${actor.name}" on TMDB`,
      );
    }
  }

  return resolved;
};

// ══════════════════════════════════════════════════════════════════════
// 3. Retrieve filmographies for each person
// ══════════════════════════════════════════════════════════════════════
export const getFilmographies = async (actors: Array<{ tmdbId: number; name: string }>) => {
  const filmographies: Map<number, any[]> = new Map();

  for (const actor of actors) {
    const id = actor.tmdbId;
    const actorNameLower = actor.name.toLowerCase();
    // Check cache first
    const cached = getCachedFilmography(id);
    if (cached) {
      filmographies.set(id, cached);
      continue;
    }

    try {
      const data: any = await tmdbGet(`/person/${id}/combined_credits`);
      
      const excludedGenres = [10767, 99, 10763, 10764]; // Talk, Doc, News, Reality
      const knownVarietyShows = ["running man", "knowing bros", "radio star", "amazing saturday", "2 days & 1 night", "infinity challenge", "weekly idol"];
      
      const cast: any[] = (data.cast || [])
        .filter((item: any) => {
          const titleLower = (item.title || item.name || "").toLowerCase();
          if (knownVarietyShows.some(v => titleLower.includes(v))) return false;
          
          if (item.genre_ids && item.genre_ids.some((g: number) => excludedGenres.includes(g))) {
            return false;
          }

          if (!item.character) return true; // keep if we don't know

          const charLower = item.character.toLowerCase();
          
          // English keywords
          if (charLower.includes("self") || charLower.includes("himself") || charLower.includes("herself") || charLower.includes("narrator") || charLower.includes("guest") || charLower.includes("host") || charLower.includes("cameo")) {
            return false;
          }
          // Korean keywords for Self, Guest, Special Appearance, MC
          if (charLower.includes("본인") || charLower.includes("게스트") || charLower.includes("진행") || charLower.includes("특별출연") || charLower.includes("mc")) {
            return false;
          }
          // If character name matches actor's real name
          if (charLower.includes(actorNameLower) || charLower === actorNameLower) {
            return false;
          }
          
          return true;
        })
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          media_type: item.media_type,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date || "",
          vote_average: item.vote_average || 0,
          popularity: item.popularity || 0,
          overview: item.overview || "",
          character: item.character || "",
        }));

      filmographies.set(id, cast);
      filmographyCache.set(id, { data: cast, timestamp: Date.now() });
    } catch (err) {
      console.warn(
        `[SceneToTitle] Failed to fetch filmography for person ${id}`,
      );
      filmographies.set(id, []);
    }
  }

  return filmographies;
};

// ══════════════════════════════════════════════════════════════════════
// 4. Intersection logic
// ══════════════════════════════════════════════════════════════════════
export const intersectFilmographies = (
  filmographies: Map<number, any[]>,
  actorNames: Map<number, string>, // personId → actorName
) => {
  const personIds = [...filmographies.keys()];

  if (personIds.length === 0) {
    return { candidateTitles: [], confidenceTier: "no_match" as const };
  }

  // ── Single actor: return top titles ranked by popularity ──────────
  if (personIds.length === 1) {
    const titles = (filmographies.get(personIds[0]) || [])
      .filter((t) => t.poster_path) // only titles with posters
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 8)
      .map((t) => ({
        ...t,
        matchedActors: [actorNames.get(personIds[0]) || "Unknown"],
        supportCount: 1,
      }));

    return { candidateTitles: titles, confidenceTier: "best_guess" as const };
  }

  // ── Multiple actors: compute full intersection ────────────────────
  const allSets = personIds.map((pid) => {
    const titles = filmographies.get(pid) || [];
    return new Set(titles.map((t) => `${t.media_type}-${t.id}`));
  });

  const fullIntersection = [...allSets[0]].filter((key) =>
    allSets.every((s) => s.has(key)),
  );

  if (fullIntersection.length > 0) {
    // Build lookup from first actor's filmography
    const lookup = new Map<string, any>();
    for (const [, titles] of filmographies) {
      for (const t of titles) {
        const key = `${t.media_type}-${t.id}`;
        if (!lookup.has(key)) lookup.set(key, t);
      }
    }

    const titles = fullIntersection
      .map((key) => {
        const title = lookup.get(key)!;
        const matched = personIds
          .filter((pid) => {
            const set = new Set(
              (filmographies.get(pid) || []).map(
                (t) => `${t.media_type}-${t.id}`,
              ),
            );
            return set.has(key);
          })
          .map((pid) => actorNames.get(pid) || "Unknown");

        return {
          ...title,
          matchedActors: matched,
          supportCount: matched.length,
        };
      })
      .filter((t) => t.poster_path)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    return {
      candidateTitles: titles,
      confidenceTier: "high_confidence" as const,
    };
  }

  // ── Fallback: pairwise intersections ──────────────────────────────
  const titleSupport = new Map<string, { title: any; actors: Set<string> }>();

  for (let i = 0; i < personIds.length; i++) {
    for (let j = i + 1; j < personIds.length; j++) {
      const setA = new Set(
        (filmographies.get(personIds[i]) || []).map(
          (t) => `${t.media_type}-${t.id}`,
        ),
      );
      const bTitles = filmographies.get(personIds[j]) || [];

      for (const t of bTitles) {
        const key = `${t.media_type}-${t.id}`;
        if (setA.has(key)) {
          if (!titleSupport.has(key)) {
            titleSupport.set(key, { title: t, actors: new Set() });
          }
          titleSupport
            .get(key)!
            .actors.add(actorNames.get(personIds[i]) || "Unknown");
          titleSupport
            .get(key)!
            .actors.add(actorNames.get(personIds[j]) || "Unknown");
        }
      }
    }
  }

  const pairwiseResults = [...titleSupport.values()]
    .map((entry) => ({
      ...entry.title,
      matchedActors: [...entry.actors],
      supportCount: entry.actors.size,
    }))
    .filter((t) => t.poster_path)
    .sort((a, b) => b.supportCount - a.supportCount || b.popularity - a.popularity)
    .slice(0, 10);

  return {
    candidateTitles: pairwiseResults,
    confidenceTier:
      pairwiseResults.length > 0
        ? ("best_guess" as const)
        : ("no_match" as const),
  };
};

// ══════════════════════════════════════════════════════════════════════
// 5. ORCHESTRATOR — Full pipeline
// ══════════════════════════════════════════════════════════════════════
export const identifyScene = async (base64Image: string, mimeType = "image/jpeg") => {
  // Step 1: Detect actors via Gemini Vision
  const geminiResult = await identifyActorsFromImage(base64Image, mimeType);

  if (geminiResult.actors.length === 0) {
    if (geminiResult.guessedTitle) {
      try {
        const searchRes: any = await tmdbGet("/search/multi", { query: geminiResult.guessedTitle });
        const candidates = (searchRes.results || []).slice(0, 5).map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          media_type: item.media_type || (item.title ? "movie" : "tv"),
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date || "",
          vote_average: item.vote_average || 0,
          popularity: item.popularity || 0,
          overview: item.overview || "",
          matchedActors: ["Identified visually by AI"],
          supportCount: 1
        })).filter((t: any) => t.poster_path);
        
        if (candidates.length > 0) {
          return {
            confidenceTier: "best_guess",
            candidateTitles: candidates,
            detectedActors: [],
            sceneAnalysis: {
              description: geminiResult.sceneDescription,
              estimatedEra: geminiResult.estimatedEra,
            },
          };
        }
      } catch (e) {
        console.error("Failed to search guessed title", e);
      }
    }

    return {
      confidenceTier: "no_match",
      candidateTitles: [],
      detectedActors: [],
      sceneAnalysis: {
        description: geminiResult.sceneDescription,
        estimatedEra: geminiResult.estimatedEra,
      },
    };
  }

  // Step 2: Resolve to TMDB persons
  const resolvedActors = await resolveActorsToTmdb(geminiResult.actors);

  if (resolvedActors.length === 0) {
    return {
      confidenceTier: "no_match",
      candidateTitles: [],
      detectedActors: geminiResult.actors.map((a: any) => ({
        ...a,
        tmdbId: 0,
        profilePath: "",
        knownFor: "Unresolved",
      })),
      sceneAnalysis: {
        description: geminiResult.sceneDescription,
        estimatedEra: geminiResult.estimatedEra,
      },
    };
  }

  // Step 3: Get filmographies
  const filmographies = await getFilmographies(resolvedActors);

  // Build personId → name map
  const actorNames = new Map<number, string>();
  for (const actor of resolvedActors) {
    actorNames.set(actor.tmdbId, actor.name);
  }

  // Step 4: Intersect filmographies
  let { candidateTitles, confidenceTier } = intersectFilmographies(
    filmographies,
    actorNames,
  );

  // If intersection failed but we have a guessed title, use it!
  if (candidateTitles.length === 0 && geminiResult.guessedTitle) {
    try {
      const searchRes: any = await tmdbGet("/search/multi", { query: geminiResult.guessedTitle });
      candidateTitles = (searchRes.results || []).slice(0, 5).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        media_type: item.media_type || (item.title ? "movie" : "tv"),
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date || "",
        vote_average: item.vote_average || 0,
        popularity: item.popularity || 0,
        overview: item.overview || "",
        matchedActors: ["Identified visually by AI (Actor mismatch)"],
        supportCount: 1
      })).filter((t: any) => t.poster_path);
      
      if (candidateTitles.length > 0) {
        confidenceTier = "best_guess";
      } else {
        confidenceTier = "no_match";
      }
    } catch (e) {
      console.error("Failed to search guessed title", e);
    }
  }

  return {
    confidenceTier,
    candidateTitles,
    detectedActors: resolvedActors,
    sceneAnalysis: {
      description: geminiResult.sceneDescription,
      estimatedEra: geminiResult.estimatedEra,
    },
  };
};
