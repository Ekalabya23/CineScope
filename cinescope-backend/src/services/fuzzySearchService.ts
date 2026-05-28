import { FuzzySearchEngine } from "./fuzzySearchEngine";

export const FuzzySearchService = {
  normalize: FuzzySearchEngine.normalize,

  score: FuzzySearchEngine.score,

  rank: <T>(
    query: string,
    items: T[],
    getSearchTerms: (item: T) => string[],
    limit = 10,
  ) =>
    items
      .map((item) => ({
        item,
        score: Math.max(...getSearchTerms(item).map((term) => FuzzySearchEngine.score(query, term))),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit),
};
