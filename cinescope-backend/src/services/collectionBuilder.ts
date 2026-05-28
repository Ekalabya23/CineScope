import {
  CollectionConfig,
  defaultCollectionConfigs,
  MediaType,
} from "../config/recommendation.config";
import { HomepageCollection } from "../models/homepageCollection.model";
import { TmdbService } from "./tmdb.service";
import { RecommendationScorer } from "./recommendationScorer";
import { formatMediaItems } from "../utils/mediaFormatter";

const buildDiscoverParams = (config: CollectionConfig) => ({
  mediaType: config.mediaType === "tv" ? "tv" : "movie",
  with_genres: config.genres,
  with_keywords: config.keywords,
  sort_by: config.sorting,
  "vote_average.gte": config.minVoteAverage,
  "vote_count.gte": config.minVoteCount,
  include_adult: false,
});

const compactParams = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );

export const CollectionBuilder = {
  getCollectionConfigs: async (): Promise<CollectionConfig[]> => {
    const stored = await HomepageCollection.find({ isActive: true })
      .sort({ priority: 1, updatedAt: -1 })
      .lean();

    const storedConfigs = stored.map((item: any) => ({
      title: item.title,
      subtitle: item.subtitle,
      mood: item.mood,
      emotionalTone: item.emotionalTone,
      layout: item.layout,
      mediaType: item.mediaType,
      theme: item.theme,
      visualTheme: item.visualTheme,
      genres: item.genres,
      keywords: item.keywords,
      sorting: item.sorting,
      minVoteAverage: item.minVoteAverage,
      minVoteCount: item.minVoteCount,
      aiStrategy: item.aiStrategy,
      recommendationReason: item.recommendationReason,
      source: item.source,
    }));

    if (!storedConfigs.length) return defaultCollectionConfigs;

    const byTitle = new Map<string, CollectionConfig>();
    defaultCollectionConfigs.forEach((config) => byTitle.set(config.title, config));
    storedConfigs.forEach((config) => byTitle.set(config.title, config));

    return Array.from(byTitle.values());
  },

  fetchCollectionItems: async (
    config: CollectionConfig,
    profile: any,
    limit = 14,
  ) => {
    const currentYear = new Date().getFullYear();
    const fetchByConfig = (mediaType: Exclude<MediaType, "mixed">) => {
      if (config.source === "trending-week") {
        return TmdbService.getTrending(mediaType, "week");
      }
      if (config.source === "trending-day") {
        return TmdbService.getTrending(mediaType, "day");
      }

      return TmdbService.discoverMedia(
        mediaType,
        compactParams({
          ...buildDiscoverParams({ ...config, mediaType }),
          sort_by:
            config.source === "top-rated"
              ? "vote_average.desc"
              : config.source === "most-watched"
                ? "vote_count.desc"
                : config.sorting,
          primary_release_year:
            config.source === "new-releases" && mediaType === "movie"
              ? currentYear
              : undefined,
          first_air_date_year:
            config.source === "new-releases" && mediaType === "tv"
              ? currentYear
              : undefined,
        }),
      );
    };

    const fetchers =
      config.mediaType === "mixed"
        ? [fetchByConfig("movie"), fetchByConfig("tv")]
        : [fetchByConfig(config.mediaType as Exclude<MediaType, "mixed">)];

    const resolved = await Promise.all(fetchers);
    const items = resolved.flat().slice(0, limit);

    return formatMediaItems(items, (item) =>
      RecommendationScorer.scoreItem(item, profile, config),
    );
  },

  buildSection: async (config: CollectionConfig, profile: any, limit = 14) => {
    const items = await CollectionBuilder.fetchCollectionItems(config, profile, limit);
    return {
      title: config.title,
      subtitle: config.subtitle,
      mood: config.mood,
      emotionalTone: config.emotionalTone,
      layout: config.layout,
      mediaType: config.mediaType,
      recommendationReason: config.recommendationReason,
      visualTheme: config.visualTheme,
      theme: config.theme,
      aiMetadata: {
        strategy: config.aiStrategy,
        scoringModel: "behavioral-mood-v1",
        cacheKey: `${config.mood}:${config.theme}:${config.sorting}`,
      },
      items,
    };
  },
};
