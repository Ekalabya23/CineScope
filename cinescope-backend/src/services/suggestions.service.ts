import { TmdbService } from "./tmdb.service";
import { TitleNormalizer } from "./titleNormalizer";
import {
  CANONICAL_UNIVERSES,
  getCanonicalEntryById,
} from "./canonicalUniverseDatabase";
import { AppError } from "../utils/appError";

export type SuggestionResult = {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: "movie" | "tv";
  rating: string;
  franchise: string;
};

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const posterUrl = (path?: string, size: string = "w300") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "";

// Very small in-memory cache to avoid repetitive TMDB calls while typing.
const cache = new Map<
  string,
  { expiresAt: number; results: SuggestionResult[] }
>();

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const getFranchiseLabel = (entryId?: string) => {
  if (!entryId) return "CineScope Universe";
  const entry = getCanonicalEntryById(entryId);
  if (!entry) return "CineScope Universe";

  // Prefer canonical universe name if present.
  const universe = CANONICAL_UNIVERSES.find((u) => u.name === entry.universe);
  return universe?.name || entry.universe || "CineScope Universe";
};

const getYear = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
};

const isExactMatch = (normalizedQuery: string, candidateTitle?: string) => {
  if (!candidateTitle) return false;
  const a = candidateTitle.toLowerCase().trim();
  const b = normalizedQuery.toLowerCase().trim();
  return a === b;
};

const scoreCandidate = (opts: {
  q: string;
  normalizedQuery: string;
  canonicalUniverse?: string;
  correctionReason?: string;
  canonicalMatchedAlias?: string;
  candidate: any;
}) => {
  const { q, normalizedQuery, canonicalUniverse, candidate } = opts;

  const title = candidate?.title || candidate?.name || "";
  const year = getYear(candidate?.release_date || candidate?.first_air_date);

  const popularity =
    typeof candidate?.popularity === "number" ? candidate.popularity : 0;
  const voteAverage =
    typeof candidate?.vote_average === "number" ? candidate.vote_average : 0;

  let score = 0;

  // 1) exact
  if (isExactMatch(normalizedQuery, title)) score += 1.4;

  // 2) canonical/universe keyword boost
  if (canonicalUniverse) {
    const u = canonicalUniverse.toLowerCase();
    const t = String(title).toLowerCase();
    if (t.includes(u.split(" ")[0])) score += 0.18;
  }

  // 3) semantic-ish: fuzzy substring from user input
  const qNorm = normalizedQuery.toLowerCase();
  const t = String(title).toLowerCase();
  if (t.includes(qNorm) || qNorm.includes(t)) score += 0.35;

  // 4) popularity / rating
  score += Math.min(1.0, popularity / 100) * 0.55;
  score += Math.min(1.0, voteAverage / 10) * 0.4;

  // 5) small penalty if year is missing
  if (!year) score -= 0.06;

  // Small recency-ish using vote_count
  const votes =
    typeof candidate?.vote_count === "number" ? candidate.vote_count : 0;
  score += Math.min(1, votes / 5000) * 0.18;

  // Prefer media_type parity lightly (typed endpoint mostly for roadmap titles)
  if (candidate?.media_type === "tv") score += 0.01;

  return score;
};

export const SuggestionsService = {
  getSuggestions: async (q: string): Promise<SuggestionResult[]> => {
    const normalizedQuery = q.trim();

    const cached = cache.get(normalizedQuery.toLowerCase());
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    try {
      const normalized = await TitleNormalizer.normalize(normalizedQuery);

      const tmdbQuery =
        normalized.tmdbValidatedTitle ||
        normalized.normalizedTitle ||
        normalizedQuery;

      // TMDB multi-search
      const raw = (await TmdbService.searchMulti(tmdbQuery))
        .filter(
          (x: any) => x && (x.media_type === "movie" || x.media_type === "tv"),
        )
        .slice(0, 12);

      const canonicalUniverse = normalized.canonicalMatch?.entry.universe;
      const correctionReason = normalized.correctionReason;

      const scored = raw
        .map((candidate: any) => {
          const score = scoreCandidate({
            q: q,
            normalizedQuery: normalized.normalizedTitle,
            canonicalUniverse,
            correctionReason,
            candidate,
          });

          return { candidate, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 8);

      const results: SuggestionResult[] = scored.map(({ candidate }: any) => {
        const type: "movie" | "tv" =
          candidate.media_type === "tv" ? "tv" : "movie";
        const title = candidate.title || candidate.name || "";
        const year =
          getYear(candidate.release_date) ||
          getYear(candidate.first_air_date) ||
          "";

        const rating = candidate.vote_average
          ? String(candidate.vote_average)
          : "";

        const poster = posterUrl(candidate.poster_path, "w300");

        const franchise = canonicalUniverse || "CineScope Universe";

        return {
          id: String(candidate.id || ""),
          title,
          year,
          poster,
          type,
          rating,
          franchise,
        };
      });

      cache.set(normalizedQuery.toLowerCase(), {
        expiresAt: Date.now() + CACHE_TTL_MS,
        results,
      });

      return results;
    } catch (err: any) {
      throw new AppError(err?.message || "Failed to resolve suggestions", 500);
    }
  },
};
