export type SentimentScores = {
  sentimentScore: number;
  emotionalImpact: number;
  cinematicDepth: number;
  recommendationConfidence: number;
};

const clamp = (value: number) => Math.max(62, Math.min(98, Math.round(value)));

export const SentimentAnalyzer = {
  score: (media: any, vibes: string[]): SentimentScores => {
    const rating = Number(media.vote_average || 7.4);
    const popularity = Number(media.popularity || 50);
    const genreBoost = vibes.includes("Emotional") || vibes.includes("Mind-Bending") ? 5 : 0;
    const depthBoost =
      vibes.includes("Philosophical") || vibes.includes("Psychological") ? 7 : 0;

    return {
      sentimentScore: clamp(rating * 9.5 + Math.min(popularity, 100) * 0.08 + genreBoost),
      emotionalImpact: clamp(rating * 9 + genreBoost + vibes.length),
      cinematicDepth: clamp(rating * 9.2 + depthBoost + (media.overview ? 4 : 0)),
      recommendationConfidence: clamp(rating * 9.4 + Math.min(popularity, 120) * 0.06),
    };
  },
};
