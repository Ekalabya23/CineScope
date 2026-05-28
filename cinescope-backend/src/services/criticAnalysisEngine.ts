import { GeminiService } from "../ai/gemini.service";
import {
  CinematicInsightBuilder,
  CreatorInsightPayload,
} from "./cinematicInsightBuilder";
import { SentimentScores } from "./sentimentAnalyzer";
import { YouTubeReviewSignal } from "./youtubeReviewService";

const isValidPayload = (value: any): value is CreatorInsightPayload =>
  value &&
  typeof value.criticConsensus === "string" &&
  Array.isArray(value.vibes) &&
  Array.isArray(value.creatorHighlights);

export const CriticAnalysisEngine = {
  analyze: async (
    media: any,
    signals: YouTubeReviewSignal[],
    vibes: string[],
    scores: SentimentScores,
  ): Promise<CreatorInsightPayload> => {
    const fallback = CinematicInsightBuilder.fallback(media, signals, vibes, scores);

    try {
      const aiPayload = await GeminiService.generateCreatorInsights({
        media,
        reviewSignals: signals,
        vibes,
        scores,
      });

      if (!isValidPayload(aiPayload)) return fallback;

      return {
        ...fallback,
        ...aiPayload,
        creatorHighlights: aiPayload.creatorHighlights.map((highlight: any, index: number) => ({
          ...fallback.creatorHighlights[index],
          ...highlight,
          creatorName:
            highlight.creatorName || fallback.creatorHighlights[index]?.creatorName,
          personality:
            highlight.personality || fallback.creatorHighlights[index]?.personality,
          avatarGradient:
            highlight.avatarGradient || fallback.creatorHighlights[index]?.avatarGradient,
          moodTags: Array.isArray(highlight.moodTags)
            ? highlight.moodTags.slice(0, 4)
            : fallback.creatorHighlights[index]?.moodTags || vibes.slice(0, 3),
        })),
      };
    } catch {
      return fallback;
    }
  },
};
