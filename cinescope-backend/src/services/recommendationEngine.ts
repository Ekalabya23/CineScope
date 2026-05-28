import { RecommendationSession } from "../models/recommendationSession.model";
import { TmdbService } from "./tmdb.service";
import { TasteProfileService } from "./tasteProfileService";
import { RecommendationScorer } from "./recommendationScorer";
import { formatMediaItems } from "../utils/mediaFormatter";

export const RecommendationEngine = {
  getSimilarRecommendations: async (userId: string, id: string, mediaType = "movie") => {
    const [profile, detailsResult] = await Promise.all([
      TasteProfileService.generateTasteProfile(userId),
      mediaType === "tv" ? TmdbService.getTvDetails(id) : TmdbService.getMovieDetails(id),
    ]);
    const details: any = detailsResult;

    const similar = details?.similar?.results || [];
    const context = {
      mood: profile?.dominantMoods?.[0] || "adaptive",
      emotionalTone: "similarity",
      theme: details?.genres?.[0]?.name || "cinematic affinity",
      recommendationReason: `Similar to ${details?.title || details?.name || "your selected title"}.`,
    };
    const items = formatMediaItems(similar.slice(0, 18), (item) =>
      RecommendationScorer.scoreItem(item, profile, context),
    );

    await RecommendationSession.create({
      userId,
      source: "similar",
      recommendationIds: items.map((item) => item.id),
      contextSnapshot: { sourceId: id, mediaType, context },
    });

    return {
      source: {
        id: details.id,
        title: details.title || details.name,
        mediaType,
      },
      items,
    };
  },
};
