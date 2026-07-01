import { genreNamesById, MoodKey } from "../config/recommendation.config";
import { ReelClip } from "../models/reelClip.model";
import { UserReelAffinity } from "../models/userReelAffinity.model";
import { formatMediaItems } from "../utils/mediaFormatter";
import { TmdbService } from "./tmdb.service";
import { GroqService } from "../ai/groq.service";

type ScoreMapLike = Map<string, number> | Record<string, number> | undefined;

type AdaptiveSectionConfig = {
  key: string;
  title: string;
  subtitle: string;
  mood: MoodKey;
  emotionalTone: string;
  visualTheme: string;
  layout: "poster-row" | "large-carousel" | "featured-split" | "bento-grid";
  mediaType: "movie" | "tv" | "mixed";
  params: Record<string, any>;
  reason: string;
  signalStrength: number;
};

const regionProfiles: Record<string, Partial<AdaptiveSectionConfig> & { params: Record<string, any> }> = {
  anime: {
    title: "More Anime Worlds For You",
    subtitle: "Animated Japanese stories rising from your recent reel and watch behavior.",
    mood: "cyberpunk",
    emotionalTone: "anime affinity",
    visualTheme: "electric sakuga",
    layout: "large-carousel",
    mediaType: "tv",
    params: { with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc" },
    reason: "Your recent behavior is leaning into anime, so this rail prioritizes Japanese animation.",
  },
  kdrama: {
    title: "K-Drama Pull",
    subtitle: "Korean series shaped by your drama and actor affinity.",
    mood: "emotional",
    emotionalTone: "korean drama signal",
    visualTheme: "soft neon romance",
    layout: "large-carousel",
    mediaType: "tv",
    params: { with_origin_country: "KR", with_original_language: "ko", sort_by: "popularity.desc" },
    reason: "Korean drama signals are strong in your recent behavior.",
  },
  cdrama: {
    title: "C-Drama Momentum",
    subtitle: "Chinese series with sweeping romance, intrigue, and long-form emotion.",
    mood: "emotional",
    emotionalTone: "c-drama affinity",
    visualTheme: "silk gold contrast",
    layout: "poster-row",
    mediaType: "tv",
    params: { with_origin_country: "CN", with_original_language: "zh", sort_by: "popularity.desc" },
    reason: "Chinese drama signals are emerging from your viewing behavior.",
  },
  bollywood: {
    title: "Indian Stories In Your Lane",
    subtitle: "Hindi and Indian cinema weighted by your regional taste signals.",
    mood: "adrenaline",
    emotionalTone: "desi audience pulse",
    visualTheme: "festival impact",
    layout: "large-carousel",
    mediaType: "movie",
    params: { with_origin_country: "IN", with_original_language: "hi", sort_by: "popularity.desc" },
    reason: "Indian title signals are shaping your current home feed.",
  },
};

const countryLabels: Record<string, string> = {
  IN: "Indian",
  KR: "Korean",
  JP: "Japanese",
  CN: "Chinese",
  US: "Hollywood",
  GB: "British",
  FR: "French",
  ES: "Spanish",
  DE: "German",
};

const languageCountries: Record<string, string> = {
  hi: "IN",
  ta: "IN",
  te: "IN",
  ml: "IN",
  kn: "IN",
  ko: "KR",
  ja: "JP",
  zh: "CN",
  en: "US",
};

const toPlainScores = (scores: ScoreMapLike): Record<string, number> => {
  if (!scores) return {};
  if (scores instanceof Map) return Object.fromEntries(scores.entries());
  return scores;
};

const topEntries = (scores: ScoreMapLike, limit: number) =>
  Object.entries(toPlainScores(scores))
    .filter(([, score]) => Number(score) > 0)
    .sort(([, left], [, right]) => Number(right) - Number(left))
    .slice(0, limit)
    .map(([key, score]) => ({ key, score: Number(score) }));

const makeSection = async (
  config: AdaptiveSectionConfig,
  profile: any,
  limit = 14,
) => {
  const mediaTypes =
    config.mediaType === "mixed" ? (["movie", "tv"] as const) : ([config.mediaType] as const);
  const paramsForMediaType = (mediaType: "movie" | "tv") => {
    const { with_cast, with_people, ...params } = config.params;
    if (mediaType === "movie" && with_cast) return { ...params, with_cast };
    if (mediaType === "tv" && with_people) return { ...params, with_people };
    return params;
  };
  const settled = await Promise.allSettled(
    mediaTypes.map((mediaType) => TmdbService.discoverMedia(mediaType, paramsForMediaType(mediaType))),
  );
  const rawItems = settled
    .filter((result): result is PromiseFulfilledResult<any[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter((item) => item.poster_path || item.backdrop_path)
    .sort(
      (a, b) =>
        (b.popularity || 0) +
        (b.vote_average || 0) * 10 -
        ((a.popularity || 0) + (a.vote_average || 0) * 10),
    )
    .slice(0, limit);

  const items = formatMediaItems(rawItems, (item) => {
    const quality = Math.min(96, Math.round((item.vote_average || 0) * 10));
    const popularity = Math.min(100, Math.round((item.popularity || 0) / 4));
    const affinity = Math.min(100, Math.round(config.signalStrength));
    const matchPercentage = Math.max(
      58,
      Math.round(affinity * 0.46 + quality * 0.32 + popularity * 0.22),
    );

    return {
      matchPercentage,
      confidence: Math.min(98, Math.max(62, matchPercentage + 8)),
      emotionalAlignment: Math.max(60, Math.round((matchPercentage + affinity) / 2)),
      moodAlignment: config.mood,
      similarityScore: affinity,
      emotionalTags: [
        config.emotionalTone,
        config.key,
        ...(profile?.dominantMoods || []).slice(0, 1),
      ].filter(Boolean),
      recommendationReason: config.reason,
    };
  });

  return {
    title: config.title,
    subtitle: config.subtitle,
    mood: config.mood,
    emotionalTone: config.emotionalTone,
    layout: config.layout,
    mediaType: config.mediaType,
    recommendationReason: config.reason,
    visualTheme: config.visualTheme,
    theme: config.key,
    aiMetadata: {
      strategy: "generate sections from reel, actor, country, language, and genre affinity",
      scoringModel: "behavioral-affinity-v2",
      signalStrength: Math.round(config.signalStrength),
      cacheKey: `adaptive:${config.key}`,
    },
    items,
  };
};

const getActorNames = async (actorIds: string[]) => {
  if (!actorIds.length) return {};
  const clips = await ReelClip.find({ actorIds: { $in: actorIds.map(Number) } })
    .select("actorIds actorNames")
    .limit(80)
    .lean();

  return clips.reduce<Record<string, string>>((names, clip: any) => {
    (clip.actorIds || []).forEach((actorId: number, index: number) => {
      const key = String(actorId);
      if (actorIds.includes(key) && clip.actorNames?.[index] && !names[key]) {
        names[key] = clip.actorNames[index];
      }
    });
    return names;
  }, {});
};

const inferCountryFromLanguage = (language: string) => languageCountries[language.toLowerCase()];

export const AdaptiveRecommendationService = {
  generateAdaptiveSections: async (userId: string, profile: any = {}, limit = 14) => {
    const affinity = await UserReelAffinity.findOne({ userId }).lean();
    if (!affinity || (affinity.interactionCount || 0) < 2) return [];

    const topRegions = topEntries(affinity.regionScores as ScoreMapLike, 3);
    const topCountries = topEntries(affinity.countryScores as ScoreMapLike, 3);
    const topLanguages = topEntries(affinity.languageScores as ScoreMapLike, 2);
    const topGenres = topEntries(affinity.genreScores as ScoreMapLike, 4);
    const topActors = topEntries(affinity.actorScores as ScoreMapLike, 2);
    const actorNames = await getActorNames(topActors.map((entry) => entry.key));

    const affinityContext = {
      topRegions: topRegions.map(r => r.key),
      topCountries: topCountries.map(c => countryLabels[c.key.toUpperCase()] || c.key),
      topLanguages: topLanguages.map(l => l.key),
      topGenres: topGenres.map(g => genreNamesById[Number(g.key)] || g.key),
      topActors: topActors.map(a => actorNames[a.key] || a.key)
    };

    let sections: AdaptiveSectionConfig[] = await GroqService.generateDynamicRails(affinityContext, 8);

    // Fallback if Groq fails or returns empty
    if (!sections || sections.length === 0) {
      topRegions.forEach(({ key, score }) => {
        const profileForRegion = regionProfiles[key.toLowerCase()];
        if (!profileForRegion) return;
        sections.push({
          key,
          title: profileForRegion.title || key,
          subtitle: profileForRegion.subtitle || "Personalized from your regional viewing signals.",
          mood: profileForRegion.mood || "emotional",
          emotionalTone: profileForRegion.emotionalTone || "regional affinity",
          visualTheme: profileForRegion.visualTheme || "local spotlight",
          layout: profileForRegion.layout || "poster-row",
          mediaType: profileForRegion.mediaType || "mixed",
          params: profileForRegion.params,
          reason: profileForRegion.reason || "Your recent behavior is shaping this regional rail.",
          signalStrength: score,
        });
      });
      
      topGenres.forEach(({ key, score }) => {
        if (sections.length >= 8) return;
        const genreId = Number(key);
        const genreName = genreNamesById[genreId] || "Your Favorite Genre";
        sections.push({
          key: `genre-${key}`,
          title: `${genreName} That Matches You`,
          subtitle: "Genre affinity balanced with quality and current audience pull.",
          mood: genreId === 16 ? "cozy" : genreId === 10749 ? "emotional" : genreId === 28 ? "adrenaline" : "mind-bending",
          emotionalTone: "genre affinity",
          visualTheme: "behavioral match",
          layout: "poster-row",
          mediaType: "mixed",
          params: { with_genres: key, sort_by: "popularity.desc" },
          reason: `Your recent behavior is consistently leaning toward ${genreName}.`,
          signalStrength: score,
        });
      });
    }

    // Default signal strength if not provided by Groq
    sections = sections.map(s => ({
      ...s,
      signalStrength: s.signalStrength || 85
    }));

    const resolved = await Promise.allSettled(
      sections.slice(0, 8).map((section) => makeSection(section, profile, limit)),
    );

    const seen = new Set<string>();
    return resolved
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => ({
        ...result.value,
        items: result.value.items.filter((item: any) => {
          const key = `${item.mediaType}:${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      }))
      .filter((section) => section.items.length >= 3);
  },
};
