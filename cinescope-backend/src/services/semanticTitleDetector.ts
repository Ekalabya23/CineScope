import { GeminiService } from "../ai/gemini.service";
import {
  CanonicalEntry,
  getAllCanonicalEntries,
  getCanonicalEntryById,
} from "./canonicalUniverseDatabase";
import { FuzzySearchService } from "./fuzzySearchService";
import { SemanticMatcher } from "./semanticMatcher";
import { TmdbService } from "./tmdb.service";

export type DetectedTitle = {
  originalQuery: string;
  detectedTitle: string;
  franchise: string;
  entry?: CanonicalEntry;
  tmdbValidatedTitle?: string;
  tmdbId?: number;
  mediaType: "movie" | "tv";
  confidence: number;
  franchiseMatchScore: number;
  correctionReason?: string;
};

const titleCandidates = (query: string) =>
  FuzzySearchService.rank(
    query,
    getAllCanonicalEntries(),
    (entry) => [entry.title, ...entry.aliases],
    12,
  ).map(({ item, score }) => ({
    id: item.id,
    title: item.title,
    aliases: item.aliases,
    universe: item.universe,
    mediaType: item.mediaType,
    score,
  }));

const chooseWithGemini = async (
  query: string,
  candidates: ReturnType<typeof titleCandidates>,
) => {
  try {
    const correction = await GeminiService.chooseNearestCanonicalTitle({
      query,
      candidates,
      strictRules: [
        "Choose only from candidates.",
        "Prefer exact franchise intent over popularity.",
        "Return null if the query points outside these candidates.",
      ],
    });
    const candidateId = typeof correction?.candidateId === "string" ? correction.candidateId : "";
    const entry = getCanonicalEntryById(candidateId);
    const candidate = candidates.find((item) => item.id === candidateId);

    if (!entry || !candidate || Number(correction?.confidence || 0) < 70) return {};

    return {
      entry,
      confidence: Number(correction.confidence || 70),
      reason: correction.reason,
    };
  } catch {
    return {};
  }
};

export const SemanticTitleDetector = {
  detect: async (query: string): Promise<DetectedTitle> => {
    const cleanQuery = query.trim();
    const semantic = SemanticMatcher.findBest(cleanQuery);
    const candidates = titleCandidates(cleanQuery);
    let entry = semantic && semantic.score >= 0.72 ? semantic.entry : undefined;
    let confidence = entry && semantic ? Math.round(semantic.score * 100) : 0;
    let correctionReason =
      entry && semantic && semantic.matchedAlias !== entry.title
        ? `Matched "${semantic.matchedAlias}" to canonical title.`
        : undefined;

    if (!entry) {
      const geminiChoice = await chooseWithGemini(cleanQuery, candidates);
      if (geminiChoice.entry) {
        entry = geminiChoice.entry;
        confidence = Math.round(geminiChoice.confidence || 70);
        correctionReason = geminiChoice.reason;
      } else if (candidates[0]?.score >= 0.58) {
        entry = getCanonicalEntryById(candidates[0].id);
        confidence = Math.round(candidates[0].score * 100);
        correctionReason = "Matched by canonical fuzzy title similarity.";
      }
    }

    const searchTitle = entry?.tmdbQuery || entry?.title || cleanQuery;
    const searchResults = await TmdbService.searchMulti(searchTitle).catch(() => []);
    const tmdbMatch =
      searchResults.find((item: any) => item.media_type === "movie" || item.media_type === "tv") ||
      {};
    const tmdbTitle = tmdbMatch.title || tmdbMatch.name;
    const tmdbConfidence = tmdbMatch.id ? 72 : 0;
    const detectedTitle = entry?.title || tmdbTitle || cleanQuery;

    return {
      originalQuery: cleanQuery,
      detectedTitle,
      franchise: entry?.universe || "Standalone / Unverified Canon",
      entry,
      tmdbValidatedTitle: tmdbTitle,
      tmdbId: tmdbMatch.id,
      mediaType: tmdbMatch.media_type === "tv" ? "tv" : "movie",
      confidence: Math.max(confidence, tmdbConfidence),
      franchiseMatchScore: entry ? Math.max(88, confidence) : tmdbConfidence,
      correctionReason,
    };
  },
};
