import { CollectionConfig } from "../config/recommendation.config";

const overlapScore = (left: string[], right: string[]) => {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right.map((item) => item.toLowerCase()));
  const matches = left.filter((item) => rightSet.has(item.toLowerCase())).length;
  return Math.round((matches / Math.max(left.length, right.length)) * 100);
};

export const RecommendationScorer = {
  scoreItem: (
    item: any,
    profile: any = {},
    context: Omit<Partial<CollectionConfig>, "mood"> & {
      mood?: string;
      themes?: string[];
    } = {},
  ) => {
    const itemGenres = (item.genres || item.genreIds || item.genre_ids || []).map(String);
    const favoriteGenres = (profile.favoriteGenres || []).map(String);
    const dominantMoods = (profile.dominantMoods || []).map(String);
    const preferredThemes = (profile.preferredThemes || []).map(String);
    const contextThemes = context.themes || (context.theme ? [context.theme] : []);

    const genreSimilarity = overlapScore(itemGenres, favoriteGenres);
    const moodSimilarity = dominantMoods
      .map((mood: string) => mood.toLowerCase())
      .includes((context.mood || "").toLowerCase())
      ? 92
      : 64;
    const themeRelevance = overlapScore(contextThemes, preferredThemes) || 68;
    const popularityScore = Math.min(100, Math.round((item.popularity || 0) / 5));
    const qualityScore = Math.min(100, Math.round((item.vote_average || 0) * 10));
    const engagementBoost =
      profile.engagementScore?.get?.(context.mood || context.theme || "") ||
      profile.engagementScore?.[context.mood || context.theme || ""] ||
      70;

    const matchPercentage = Math.round(
      genreSimilarity * 0.22 +
        moodSimilarity * 0.22 +
        themeRelevance * 0.18 +
        qualityScore * 0.18 +
        popularityScore * 0.1 +
        engagementBoost * 0.1,
    );

    const confidence = Math.min(
      98,
      Math.max(56, Math.round(matchPercentage * 0.82 + qualityScore * 0.18)),
    );

    return {
      matchPercentage,
      confidence,
      emotionalAlignment: Math.round((moodSimilarity + themeRelevance) / 2),
      moodAlignment: context.mood || "adaptive",
      similarityScore: Math.round((genreSimilarity + themeRelevance) / 2),
      emotionalTags: [context.emotionalTone, context.mood, context.theme].filter(
        (tag): tag is string => Boolean(tag),
      ),
      recommendationReason:
        context.recommendationReason ||
        `${context.mood || "Cinematic"} themes align with your recent viewing behavior.`,
    };
  },
};
