import { TmdbService } from "./tmdb.service";
import { SemanticMatch, SemanticMatcher } from "./semanticMatcher";
import { GeminiService } from "../ai/gemini.service";
import {
  CanonicalEntry,
  getAllCanonicalEntries,
  getCanonicalEntryById,
} from "./canonicalUniverseDatabase";
import { FuzzySearchEngine } from "./fuzzySearchEngine";

export type NormalizedTitle = {
  originalQuery: string;
  normalizedTitle: string;
  canonicalMatch?: SemanticMatch;
  tmdbValidatedTitle?: string;
  tmdbId?: number;
  mediaType: "movie" | "tv";
  confidence: number;
  correctionReason?: string;
};

const nearestCanonicalCandidates = (query: string) =>
  getAllCanonicalEntries()
    .map((entry) => {
      const aliases = [entry.title, ...entry.aliases];
      const score = Math.max(
        ...aliases.map((alias) => FuzzySearchEngine.score(query, alias)),
      );
      return {
        id: entry.id,
        title: entry.title,
        aliases: entry.aliases,
        universe: entry.universe,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

const chooseGeminiCorrection = async (
  query: string,
  candidates: ReturnType<typeof nearestCanonicalCandidates>,
): Promise<{ entry?: CanonicalEntry; confidence?: number; reason?: string }> => {
  try {
    const correction = await GeminiService.chooseNearestCanonicalTitle({
      query,
      candidates,
    });
    const candidateId =
      typeof correction?.candidateId === "string" ? correction.candidateId : "";
    const entry = getCanonicalEntryById(candidateId);
    const candidate = candidates.find((item) => item.id === candidateId);

    if (!entry || !candidate || Number(correction.confidence || 0) < 70) {
      return {};
    }

    return {
      entry,
      confidence: Number(correction.confidence || 70),
      reason: correction.reason,
    };
  } catch {
    return {};
  }
};

export const TitleNormalizer = {
  normalize: async (query: string): Promise<NormalizedTitle> => {
    let canonicalMatch = SemanticMatcher.findBest(query);
    let correctionReason: string | undefined;
    const candidates = nearestCanonicalCandidates(query);

    if (!canonicalMatch || canonicalMatch.score < 0.72) {
      const geminiCorrection = await chooseGeminiCorrection(query, candidates);
      if (geminiCorrection.entry) {
        canonicalMatch = {
          entry: geminiCorrection.entry,
          score: (geminiCorrection.confidence || 70) / 100,
          matchedAlias: geminiCorrection.entry.title,
          method: "fuzzy",
        };
        correctionReason = geminiCorrection.reason;
      } else if (candidates[0]?.score >= 0.58) {
        const entry = getCanonicalEntryById(candidates[0].id);
        if (entry) {
          canonicalMatch = {
            entry,
            score: candidates[0].score,
            matchedAlias: candidates[0].title,
            method: "fuzzy",
          };
          correctionReason = "Matched by nearest canonical title similarity.";
        }
      }
    }

    const titleForSearch = canonicalMatch?.entry.tmdbQuery || canonicalMatch?.entry.title || query;
    const searchResults = await TmdbService.searchMulti(titleForSearch).catch(() => []);
    const tmdbMatch =
      searchResults.find((item: any) => item.media_type === "movie" || item.media_type === "tv") ||
      {};

    return {
      originalQuery: query,
      normalizedTitle:
        canonicalMatch?.entry.title || tmdbMatch.title || tmdbMatch.name || query,
      canonicalMatch: canonicalMatch || undefined,
      tmdbValidatedTitle: tmdbMatch.title || tmdbMatch.name,
      tmdbId: tmdbMatch.id,
      mediaType: tmdbMatch.media_type === "tv" ? "tv" : "movie",
      correctionReason,
      confidence: Math.round(
        Math.max(
          canonicalMatch ? canonicalMatch.score * 100 : 0,
          tmdbMatch.id ? 72 : 0,
        ),
      ),
    };
  },
};
