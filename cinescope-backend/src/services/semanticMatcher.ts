import {
  CANONICAL_UNIVERSES,
  CanonicalEntry,
  getAllCanonicalEntries,
} from "./canonicalUniverseDatabase";
import { FuzzySearchEngine } from "./fuzzySearchEngine";

export type SemanticMatch = {
  entry: CanonicalEntry;
  score: number;
  matchedAlias: string;
  method: "alias" | "fuzzy" | "franchise-keyword";
};

const franchiseKeywordBoost = (query: string, entry: CanonicalEntry) => {
  const normalizedQuery = FuzzySearchEngine.normalize(query);
  const universe = CANONICAL_UNIVERSES.find((item) => item.name === entry.universe);
  const hasUniverseKeyword = universe?.aliases.some((alias) =>
    normalizedQuery.includes(FuzzySearchEngine.normalize(alias)),
  );
  return hasUniverseKeyword ? 0.06 : 0;
};

export const SemanticMatcher = {
  findBest: (query: string): SemanticMatch | null => {
    const normalizedQuery = FuzzySearchEngine.normalize(query);
    const matches: SemanticMatch[] = [];

    getAllCanonicalEntries().forEach((entry) => {
      const candidates = [entry.title, ...entry.aliases];
      candidates.forEach((candidate) => {
        const normalizedCandidate = FuzzySearchEngine.normalize(candidate);

        let baseScore: number;
        let method: SemanticMatch["method"];

        if (normalizedQuery === normalizedCandidate) {
          // Exact match after normalization — highest score
          baseScore = 0.98;
          method = "alias";
        } else if (normalizedCandidate.includes(normalizedQuery)) {
          // The query is a substring of the candidate (e.g. "born again" matches "daredevil born again")
          // Penalize based on how much shorter the query is vs the candidate
          const ratio = normalizedQuery.length / normalizedCandidate.length;
          baseScore = 0.70 + ratio * 0.22; // 0.70–0.92 range
          method = "alias";
        } else if (normalizedQuery.includes(normalizedCandidate)) {
          // The candidate is a substring of the query (e.g. alias "daredevil" matches query "daredevil born again")
          // Penalize heavily — shorter candidates matching long queries are likely wrong
          const ratio = normalizedCandidate.length / normalizedQuery.length;
          baseScore = 0.50 + ratio * 0.30; // 0.50–0.80 range
          method = "alias";
        } else {
          // No substring match — fall back to fuzzy scoring
          baseScore = FuzzySearchEngine.score(normalizedQuery, normalizedCandidate);
          method = "fuzzy";
        }

        const score = Math.min(1, baseScore + franchiseKeywordBoost(query, entry));

        matches.push({
          entry,
          score,
          matchedAlias: candidate,
          method: method === "alias" ? method : score > baseScore ? "franchise-keyword" : "fuzzy",
        });
      });
    });

    const best = matches.sort((left, right) => right.score - left.score)[0];
    return best && best.score >= 0.46 ? best : null;
  },
};
