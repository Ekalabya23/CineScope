import { RecommendationSession } from "../models/recommendationSession.model";
import { CollectionBuilder } from "./collectionBuilder";
import { HeroSelector } from "./heroSelector";
import { TasteProfileService } from "./tasteProfileService";

export const HomepageService = {
  generateHomepage: async (userId: string) => {
    const [profile, configs] = await Promise.all([
      TasteProfileService.generateTasteProfile(userId),
      CollectionBuilder.getCollectionConfigs(),
    ]);

    const sectionResults = await Promise.allSettled(
      configs.map((config) => CollectionBuilder.buildSection(config, profile)),
    );

    const sections = sectionResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((section) => section.items.length > 0);

    const heroPool = sections.flatMap((section) => section.items).slice(0, 50);
    const heroBanner = await HeroSelector.selectHero(heroPool);

    await RecommendationSession.create({
      userId,
      source: "homepage",
      sectionTitles: sections.map((section) => section.title),
      recommendationIds: sections.flatMap((section) =>
        section.items.slice(0, 6).map((item: any) => item.id),
      ),
      contextSnapshot: {
        favoriteGenres: profile?.favoriteGenres,
        dominantMoods: profile?.dominantMoods,
        watchPattern: profile?.watchPattern,
      },
    });

    return {
      heroBanner,
      sections,
      layoutMetadata: {
        generatedAt: new Date().toISOString(),
        orchestrationModel: "cine-homepage-v1",
        personalization: "behavioral-mood-context",
        caching: { recommendedTtlSeconds: 900, redisReady: true },
      },
    };
  },
};
