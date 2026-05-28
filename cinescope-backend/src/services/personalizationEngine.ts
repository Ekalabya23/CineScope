import { defaultCollectionConfigs } from "../config/recommendation.config";
import { RecommendationSession } from "../models/recommendationSession.model";
import { CollectionBuilder } from "./collectionBuilder";
import { TasteProfileService } from "./tasteProfileService";

export const PersonalizationEngine = {
  generatePersonalizedRecommendations: async (userId: string) => {
    const profile = await TasteProfileService.generateTasteProfile(userId);
    const dominantMood = profile?.dominantMoods?.[0] || "mind-bending";

    const personalizationSourceConfigs = defaultCollectionConfigs.filter(
      (config) => !config.source,
    );

    const configs = personalizationSourceConfigs.map((config) => {
      if (config.mood === dominantMood) {
        return {
          ...config,
          title: `Because You Love ${dominantMood}`,
          recommendationReason: "Weighted from your strongest mood cluster.",
        };
      }
      return config;
    });

    const personalizedConfigs = [
      ...configs.slice(0, 4),
      {
        ...personalizationSourceConfigs[0],
        title: "AI Emotional Match",
        subtitle: "High-confidence picks from your emotional and genre signature.",
        mood: dominantMood,
      },
      {
        ...personalizationSourceConfigs[2],
        title:
          profile?.watchPattern === "Late Night"
            ? "Late Night Psychological Picks"
            : "Mind-Bending Universes",
      },
    ];

    const sections = (
      await Promise.allSettled(
        personalizedConfigs.map((config) => CollectionBuilder.buildSection(config as any, profile, 12)),
      )
    )
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((section) => section.items.length > 0);

    await RecommendationSession.create({
      userId,
      source: "personalized",
      sectionTitles: sections.map((section) => section.title),
      recommendationIds: sections.flatMap((section) => section.items.map((item: any) => item.id)),
      contextSnapshot: profile,
    });

    return { tasteProfile: profile, sections };
  },
};
