import { ReelClip } from "../models/reelClip.model";
import { UserReelAffinity } from "../models/userReelAffinity.model";
import { TmdbService } from "./tmdb.service";

type ReelAffinityAction = "skip_fast" | "watched_full" | "tapped_through" | "saved" | "liked" | "unliked" | "shared";
type RecommendationAffinityAction =
  | "recommended"
  | "accepted"
  | "ignored"
  | "saved"
  | "trailer_click"
  | "completed"
  | "hover"
  | "watchlist_add"
  | "search"
  | "detail_click";

const POSITIVE_ACTIONS = new Set<ReelAffinityAction>(["watched_full", "liked", "saved", "tapped_through"]);
const NEGATIVE_ACTIONS = new Set<ReelAffinityAction>(["skip_fast", "unliked"]);
const POSITIVE_RECOMMENDATION_ACTIONS = new Set<RecommendationAffinityAction>([
  "accepted",
  "saved",
  "trailer_click",
  "completed",
  "watchlist_add",
  "detail_click",
]);
const NEGATIVE_RECOMMENDATION_ACTIONS = new Set<RecommendationAffinityAction>(["ignored"]);

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const updateScoreMap = (
  current: Map<string, number> | Record<string, number> | undefined,
  keys: string[],
  delta: number,
) => {
  const map = new Map<string, number>(
    current instanceof Map ? current : Object.entries(current || {}),
  );

  keys.forEach((key) => {
    if (!key) return;
    map.set(key, clamp(Number(map.get(key) || 0) + delta));
  });

  return map;
};

const normalizeMap = (current: Map<string, number>) => {
  const values = Array.from(current.values());
  const max = Math.max(...values, 1);
  if (max <= 1) return current;

  return new Map(Array.from(current.entries()).map(([key, value]) => [key, value / max]));
};

const inferRegionTags = (language?: string, countries: string[] = []) => {
  const tags = new Set<string>();
  const normalizedLanguage = String(language || "").toLowerCase();
  const normalizedCountries = new Set(countries.map((country) => String(country).toUpperCase()));

  if (normalizedCountries.has("JP") || normalizedLanguage === "ja") tags.add("anime");
  if (normalizedCountries.has("KR") || normalizedLanguage === "ko") tags.add("kdrama");
  if (normalizedCountries.has("CN") || normalizedLanguage === "zh") tags.add("cdrama");
  if (normalizedCountries.has("IN") || ["hi", "ta", "te", "ml", "kn"].includes(normalizedLanguage)) {
    tags.add("bollywood");
  }

  return Array.from(tags);
};

const inferMoodTags = (genreIds: number[] = []) => {
  const genres = new Set(genreIds);
  return [
    genres.has(28) || genres.has(12) ? "adrenaline" : "",
    genres.has(10749) || genres.has(18) ? "emotional" : "",
    genres.has(16) || genres.has(35) || genres.has(10751) ? "cozy" : "",
    genres.has(53) || genres.has(80) || genres.has(27) ? "dark" : "",
    genres.has(878) || genres.has(9648) ? "mind-bending" : "",
  ].filter(Boolean);
};

const applyAffinityDelta = async (
  userId: string,
  delta: number,
  signals: {
    moodTags?: string[];
    genreIds?: Array<number | string>;
    actorIds?: Array<number | string>;
    countries?: string[];
    language?: string;
    regionTags?: string[];
  },
) => {
  const affinity = await UserReelAffinity.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const moodScores = updateScoreMap(
    affinity.moodScores as Map<string, number>,
    (signals.moodTags || []).map(String),
    delta,
  );
  const genreScores = updateScoreMap(
    affinity.genreScores as Map<string, number>,
    (signals.genreIds || []).map(String),
    delta,
  );
  const actorScores = updateScoreMap(
    affinity.actorScores as Map<string, number>,
    (signals.actorIds || []).map(String),
    delta * 0.8,
  );
  const countryScores = updateScoreMap(
    affinity.countryScores as Map<string, number>,
    (signals.countries || []).map(String),
    delta,
  );
  const languageScores = updateScoreMap(
    affinity.languageScores as Map<string, number>,
    signals.language ? [String(signals.language)] : [],
    delta,
  );
  const regionScores = updateScoreMap(
    affinity.regionScores as Map<string, number>,
    (signals.regionTags || []).map(String),
    delta * 1.1,
  );

  const interactionCount = (affinity.interactionCount || 0) + 1;
  affinity.moodScores = interactionCount % 50 === 0 ? normalizeMap(moodScores) : moodScores;
  affinity.genreScores = interactionCount % 50 === 0 ? normalizeMap(genreScores) : genreScores;
  affinity.actorScores = interactionCount % 50 === 0 ? normalizeMap(actorScores) : actorScores;
  affinity.countryScores = interactionCount % 50 === 0 ? normalizeMap(countryScores) : countryScores;
  affinity.languageScores = interactionCount % 50 === 0 ? normalizeMap(languageScores) : languageScores;
  affinity.regionScores = interactionCount % 50 === 0 ? normalizeMap(regionScores) : regionScores;
  affinity.interactionCount = interactionCount;
  affinity.lastUpdated = new Date();

  await affinity.save();
};

export const AffinityUpdateService = {
  updateFromInteraction: async (
    userId: string,
    reelId: string,
    action: ReelAffinityAction,
  ) => {
    if (!POSITIVE_ACTIONS.has(action) && !NEGATIVE_ACTIONS.has(action)) return;

    const clip = await ReelClip.findById(reelId)
      .select("moodTags genreIds actorIds originCountries originalLanguage regionTags")
      .lean();
    if (!clip) return;

    await applyAffinityDelta(userId, POSITIVE_ACTIONS.has(action) ? 0.05 : -0.02, {
      moodTags: (clip.moodTags || []).map(String),
      genreIds: clip.genreIds || [],
      actorIds: clip.actorIds || [],
      countries: (clip.originCountries || []).map(String),
      language: clip.originalLanguage ? String(clip.originalLanguage) : undefined,
      regionTags: (clip.regionTags || []).map(String),
    });
  },

  updateFromMediaInteraction: async (
    userId: string,
    mediaId: string | number,
    mediaType: "movie" | "tv" | "mixed",
    action: RecommendationAffinityAction,
    metadata: Record<string, any> = {},
  ) => {
    if (!POSITIVE_RECOMMENDATION_ACTIONS.has(action) && !NEGATIVE_RECOMMENDATION_ACTIONS.has(action)) return;
    if (!mediaId) return;

    const resolvedMediaType = mediaType === "tv" ? "tv" : "movie";
    const details: any =
      resolvedMediaType === "tv"
        ? await TmdbService.getTvDetails(mediaId)
        : await TmdbService.getMovieDetails(mediaId);

    const genreIds = (details?.genres || []).map((genre: any) => genre.id).filter(Boolean);
    const actorIds = (details?.credits?.cast || [])
      .slice(0, 8)
      .map((actor: any) => actor.id)
      .filter(Boolean);
    const countries = Array.from(
      new Set([
        ...(details?.origin_country || []),
        ...(details?.production_countries || []).map((country: any) => country.iso_3166_1),
      ]),
    ).filter(Boolean) as string[];
    const language = details?.original_language;
    const regionTags = inferRegionTags(language, countries);
    const moodTags = [
      metadata?.mood,
      ...(Array.isArray(metadata?.moods) ? metadata.moods : []),
      ...inferMoodTags(genreIds),
    ].filter(Boolean);

    await applyAffinityDelta(
      userId,
      POSITIVE_RECOMMENDATION_ACTIONS.has(action) ? 0.07 : -0.025,
      {
        moodTags,
        genreIds,
        actorIds,
        countries,
        language,
        regionTags,
      },
    );
  },
};
