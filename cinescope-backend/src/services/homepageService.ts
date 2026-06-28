import { RecommendationSession } from "../models/recommendationSession.model";
import { CollectionBuilder } from "./collectionBuilder";
import { HeroSelector } from "./heroSelector";
import { TasteProfileService } from "./tasteProfileService";
import { UnifiedRecommendationEngine } from "./unifiedRecommendationEngine";

const genericSectionPattern = /trending|popular right now|top rated|new releases|most watched/i;

const mergeSections = (adaptiveSections: any[], baseSections: any[]) => {
  if (!adaptiveSections.length) return baseSections;

  const seenTitles = new Set(adaptiveSections.map((section) => section.title));
  const focusedBase = baseSections.filter((section) => {
    if (seenTitles.has(section.title)) return false;
    if (genericSectionPattern.test(section.title)) return false;
    seenTitles.add(section.title);
    return true;
  });

  return [...adaptiveSections, ...focusedBase.slice(0, 8)];
};

export const HomepageService = {
  generateHomepage: async (userId: string) => {
    const [profile, configs] = await Promise.all([
      TasteProfileService.generateTasteProfile(userId),
      CollectionBuilder.getCollectionConfigs(),
    ]);

    const [unifiedResult, sectionResults] = await Promise.all([
      UnifiedRecommendationEngine.generateHomeSections(userId, profile),
      Promise.allSettled(
        configs.map((config) => CollectionBuilder.buildSection(config, profile)),
      ),
    ]);

    const baseSections = sectionResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((section) => section.items.length > 0);
    const adaptiveSections = unifiedResult.sections;
    const sections = mergeSections(adaptiveSections, baseSections);

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
        adaptiveSignals: adaptiveSections.map((section) => section.theme),
      },
    });

    return {
      heroBanner,
      sections,
      layoutMetadata: {
        generatedAt: new Date().toISOString(),
        orchestrationModel: unifiedResult.orchestration.engine,
        personalization: adaptiveSections.length
          ? "behavioral-affinity-homepage"
          : "behavioral-mood-context",
        unifiedRecommendation: unifiedResult.orchestration,
        caching: { recommendedTtlSeconds: 900, redisReady: true },
      },
    };
  },
};
