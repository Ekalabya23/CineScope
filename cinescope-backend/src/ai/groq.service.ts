import axios from "axios";
import { ENV } from "../config/env";
import { SYSTEM_INSTRUCTION } from "./prompts";

const groqRequestWithFallback = async (messages: any[], temperature: number, isChatbot = false) => {
  const models = isChatbot ? [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-8b-instant",
    "llama3-8b-8192"
  ] : [
    "llama-3.3-70b-versatile",
    "qwen/qwen3.6-27b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-8b-instant",
    "llama3-8b-8192"
  ];
  let lastError;

  for (const model of models) {
    try {
      const isNvidia = model.startsWith("openai/gpt-oss");
      if (isNvidia && !ENV.NVIDIA_API_KEY) continue;
      
      const endpoint = isNvidia 
        ? "https://integrate.api.nvidia.com/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions";
        
      const apiKey = isNvidia ? ENV.NVIDIA_API_KEY : ENV.GROQ_API_KEY;

      const payload: any = {
        model,
        messages,
        temperature,
      };
      
      if (!isNvidia) {
        payload.response_format = { type: "json_object" };
      }

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.choices[0].message.content || (isNvidia ? "" : "{}");
    } catch (error: any) {
      lastError = error;
      console.warn(`[CineScope AI] Failed on ${model} (${error?.response?.data?.error?.code || error?.response?.status}), falling back...`);
      continue;
    }
  }
  throw lastError;
};

export const GroqService = {
  generateDynamicRails: async (
    affinityContext: {
      topRegions: string[];
      topCountries: string[];
      topLanguages: string[];
      topGenres: string[];
      topActors: string[];
    },
    limit: number = 8
  ): Promise<any[]> => {
    const systemPrompt = `You are an advanced AI recommendation engine for CineScope.
Your task is to generate highly personalized, culturally and regionally specific cinematic recommendation rails (sections) for a user based on their behavioral affinity.

The user's top affinities are:
${JSON.stringify(affinityContext, null, 2)}

Create exactly ${limit} unique recommendation rails. Use a mix of combinations. For example, if they like "hi" (Hindi) language and "28" (Action) genre, create a "Hindi Dubbed Thrillers" or "High-Octane Bollywood" rail.

For each rail, provide the exact TMDB API parameters needed to fetch those movies/shows.
- Use \`with_original_language\` for languages (e.g., 'hi', 'ja', 'ko').
- Use \`with_origin_country\` for countries (e.g., 'IN', 'KR', 'JP').
- Use \`with_genres\` for genres.
- Use \`with_cast\` or \`with_people\` for actors.

Available layouts: "poster-row", "large-carousel"
Available media types: "movie", "tv", "mixed"
Available moods: "adrenaline", "emotional", "mind-bending", "cyberpunk", "cozy", "slow-burn"

Return a strictly valid JSON object with a \`sections\` array containing exactly this structure:
{
  "sections": [
    {
      "key": "unique-rail-id-e-g-hindi-action",
      "title": "High-Octane Bollywood",
      "subtitle": "Hindi action hits tailored to your adrenaline affinity.",
      "mood": "adrenaline",
      "emotionalTone": "desi action signal",
      "visualTheme": "festival impact",
      "layout": "large-carousel",
      "mediaType": "mixed",
      "params": {
        "with_original_language": "hi",
        "with_genres": "28",
        "sort_by": "popularity.desc"
      },
      "reason": "Because you love Hindi cinema and action genres."
    }
  ]
}

DO NOT include any markdown blocks in your response. Ensure the output is parsable JSON.`;

    try {
      const responseText = await groqRequestWithFallback(
        [{ role: "system", content: systemPrompt }],
        0.7
      );
      const parsed = JSON.parse(responseText.trim());
      
      return parsed.sections || [];
    } catch (error: any) {
      console.error("[CineScope AI] Groq API error generating rails:", error?.response?.data || error.message);
      return [];
    }
  },

  generateDynamicRoadmap: async (targetTitle: string, targetYear: string, targetType: string): Promise<any> => {
    const systemPrompt = `You are the CineScope Canonical Franchise Intelligence Engine.
Your task is to generate a comprehensive, continuity-accurate cinematic watch roadmap for a given title.

The user is asking for a roadmap around: "${targetTitle}" (${targetYear}) [${targetType}].

Identify the broader cinematic universe or franchise this title belongs to.
Then, build a chronological timeline of:
1. Essential Viewing: Hard prerequisites needed to understand the target, AND the target itself.
2. Recommended Viewing: Important context or highly relevant continuity within the franchise.
3. Optional Viewing: Extended universe background or minor spin-offs.

CRITICAL RULES:
- Only include real, officially released movies, TV shows, or anime.
- Do NOT invent titles or crossovers.
- You MUST include the exact target movie as the final item in "essentialViewing".
- You MUST include major overarching story prerequisites (e.g., Infinity War before Endgame).
- Provide the exact official release title.
- Provide the release year.
- Keep the total number of recommended items reasonable (max 10-15 items).

Return ONLY valid JSON in this exact structure:
{
  "universe": "The overarching franchise name (e.g. Marvel Cinematic Universe)",
  "emotionalArc": ["keyword1", "keyword2", "keyword3"],
  "essentialViewing": [
    {
      "title": "Exact Title",
      "year": "YYYY",
      "explanation": "Why it's essential before the target"
    }
  ],
  "recommendedViewing": [
    {
      "title": "Exact Title",
      "year": "YYYY",
      "explanation": "Why it's recommended"
    }
  ],
  "optionalViewing": [
    {
      "title": "Exact Title",
      "year": "YYYY",
      "explanation": "Why it's optional"
    }
  ],
  "aiSummary": "One cinematic sentence explaining the scope of this roadmap."
}`;

    try {
      const responseText = await groqRequestWithFallback(
        [{ role: "system", content: systemPrompt }],
        0.3
      );
      return JSON.parse(responseText.trim());
    } catch (error: any) {
      console.error("[CineScope AI] Groq API error generating dynamic roadmap:", error?.response?.data || error.message);
      return null;
    }
  },

  explainRoadmap: async (enrichedContext: Record<string, any>): Promise<any> => {
    const prompt = `You are CineScope's continuity explanation writer.
CRITICAL RULES:
- Do not add, remove, reorder, or invent watch entries.
- The backend has already validated the canon order.
- Only explain the provided entries, emotional arc, and continuity importance.

Return ONLY valid JSON:
{
  "continuityInsight": "one concise cinematic paragraph",
  "emotionalArc": ["short phase names using only provided context"],
  "nodeExplanations": {
    "canonical-entry-id": {
      "aiExplanation": "one sentence",
      "emotionalRelevance": "short phrase",
      "continuitySignificance": "short factual phrase"
    }
  },
  "narrativeProgression": {
    "summary": "one sentence",
    "phases": [{ "label": "Phase 1", "description": "short sentence" }]
  }
}

Validated canon context:
${JSON.stringify(enrichedContext, null, 2)}`;

    try {
      const responseText = await groqRequestWithFallback(
        [{ role: "user", content: prompt }],
        0.3
      );
      return JSON.parse(responseText.trim());
    } catch (error: any) {
      console.error("[CineScope AI] Groq API error explaining roadmap:", error?.response?.data || error.message);
      return {};
    }
  },

  analyzePrompt: async (
    userPrompt: string,
    historyContext: any[] = [],
    enrichedContext: Record<string, any> = {},
  ): Promise<any> => {
    const formattedHistory = historyContext.map((chat) => ({
      role: chat.role === "model" ? "assistant" : "user",
      content: chat.parts.map((p: any) => p.text).join(" "),
    }));

    const systemContent = `${SYSTEM_INSTRUCTION}

Personalization Context:
${JSON.stringify(enrichedContext, null, 2)}`;

    try {
      const responseText = await groqRequestWithFallback(
        [
          { role: "system", content: systemContent },
          ...formattedHistory,
          { role: "user", content: userPrompt }
        ],
        0.3,
        true
      );
      return JSON.parse(responseText.trim().replace(/```json|```/g, ""));
    } catch (error: any) {
      console.error("[CineScope AI] Groq API fallback exhausted in analyzePrompt:", error?.response?.data || error.message);
      return {
        intentAnalysis: "Fallback processing configuration invoked.",
        searchQuery: userPrompt,
        tmdbFilters: {
          mediaType: "movie",
          with_genres: "",
          sort_by: "popularity.desc",
        },
        explanation:
          "Here is what I gathered based on your current exploration track.",
      };
    }
  },
};
