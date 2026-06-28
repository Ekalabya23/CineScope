import { FilterQuery } from "mongoose";
import { ReelClip } from "../models/reelClip.model";
import { ReelInteraction } from "../models/reelInteraction.model";
import { UserReelAffinity } from "../models/userReelAffinity.model";
import { moodProfiles } from "../config/recommendation.config";

const WEIGHTS = {
  completion: 0.24,
  like: 0.17,
  tapThrough: 0.12,
  moodAffinity: 0.13,
  genreAffinity: 0.1,
  actorAffinity: 0.1,
  regionAffinity: 0.08,
  languageAffinity: 0.04,
  countryAffinity: 0.04,
  comboAffinity: 0.08,
  recency: 0.08,
  skipPenalty: 0.25,
  recentRepeatPenalty: 0.18,
};

const MAX_CANDIDATES = 150;
const FEED_FIELDS =
  "videoUrl thumbnailUrl durationMs tmdbId mediaType title posterPath genreIds actorIds actorNames originalLanguage originCountries regionTags moodTags vibeLabel viewCount likeCount completionRate tapThroughRate skipFastRate createdAt";

type AffinityDoc = {
  moodScores?: Map<string, number> | Record<string, number>;
  genreScores?: Map<string, number> | Record<string, number>;
  actorScores?: Map<string, number> | Record<string, number>;
  countryScores?: Map<string, number> | Record<string, number>;
  languageScores?: Map<string, number> | Record<string, number>;
  regionScores?: Map<string, number> | Record<string, number>;
};

type RecentContext = {
  reelIds: Set<string>;
  tmdbIds: Set<number>;
  actorIds: Set<number>;
};

const toPlainScores = (value: Map<string, number> | Record<string, number> | undefined) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return value;
};

const topKeys = (scores: Record<string, number>, limit: number) =>
  Object.entries(scores)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([key]) => key);

const rate = (value: unknown) =>
  Math.max(0, Math.min(1, typeof value === "number" ? value : Number(value || 0)));

const clipLikeRate = (clip: any) => {
  const likes = Math.max(Number(clip.likeCount || 0), 0);
  const views = Math.max(Number(clip.viewCount || 0), 0);
  return Math.max(0, Math.min(1, (likes + 2) / (views + 10)));
};

const cosineForStringVector = (keys: string[], scores: Record<string, number>) => {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  if (uniqueKeys.length === 0) return 0;

  const dot = uniqueKeys.reduce((sum, key) => sum + Number(scores[key] || 0), 0);
  const clipMagnitude = Math.sqrt(uniqueKeys.length);
  const userMagnitude = Math.sqrt(
    Object.values(scores).reduce((sum, value) => sum + Number(value || 0) ** 2, 0),
  );

  if (clipMagnitude === 0 || userMagnitude === 0) return 0;
  return Math.max(0, Math.min(1, dot / (clipMagnitude * userMagnitude)));
};

const recencyDecay = (createdAt: Date | string) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.max(0, ageMs / (1000 * 60 * 60 * 24));
  return Math.exp(-days / 7);
};

const getAffinity = async (userId: string) =>
  UserReelAffinity.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, lastUpdated: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

const getRecentContext = async (userId: string): Promise<RecentContext> => {
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const interactions = await ReelInteraction.find({
    userId,
    createdAt: { $gte: since },
  })
    .select("reelId")
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();
  const reelIds = Array.from(new Set(interactions.map((item: any) => String(item.reelId))));
  const clips = await ReelClip.find({ _id: { $in: reelIds } })
    .select("tmdbId actorIds")
    .lean();

  return {
    reelIds: new Set(reelIds),
    tmdbIds: new Set(clips.map((clip: any) => Number(clip.tmdbId)).filter(Number.isFinite)),
    actorIds: new Set(clips.flatMap((clip: any) => clip.actorIds || []).map(Number).filter(Number.isFinite)),
  };
};

const fetchCandidatePool = async (affinity: AffinityDoc, recentContext: RecentContext) => {
  const moodScores = toPlainScores(affinity.moodScores);
  const genreScores = toPlainScores(affinity.genreScores);
  const actorScores = toPlainScores(affinity.actorScores);
  const regionScores = toPlainScores(affinity.regionScores);
  const languageScores = toPlainScores(affinity.languageScores);
  const countryScores = toPlainScores(affinity.countryScores);
  const topMoods = topKeys(moodScores, 2);
  const topGenres = topKeys(genreScores, 2).map(Number).filter(Number.isFinite);
  const topActors = topKeys(actorScores, 3).map(Number).filter(Number.isFinite);
  const topRegions = topKeys(regionScores, 2);
  const topLanguages = topKeys(languageScores, 2);
  const topCountries = topKeys(countryScores, 2);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const notRecentlySeen = { _id: { $nin: Array.from(recentContext.reelIds) } };

  const shortcutOr: FilterQuery<any>[] = [];
  if (topMoods.length > 0) shortcutOr.push({ moodTags: { $in: topMoods } });
  if (topGenres.length > 0) shortcutOr.push({ genreIds: { $in: topGenres } });
  if (topActors.length > 0) shortcutOr.push({ actorIds: { $in: topActors } });
  if (topRegions.length > 0) shortcutOr.push({ regionTags: { $in: topRegions } });
  if (topLanguages.length > 0) shortcutOr.push({ originalLanguage: { $in: topLanguages } });
  if (topCountries.length > 0) shortcutOr.push({ originCountries: { $in: topCountries } });

  const [recent, evergreen, matched] = await Promise.all([
    ReelClip.find({ isActive: true, ...notRecentlySeen, createdAt: { $gte: last30Days } })
      .select(FEED_FIELDS)
      .sort({ createdAt: -1 })
      .limit(MAX_CANDIDATES)
      .lean(),
    ReelClip.find({ isActive: true, ...notRecentlySeen })
      .select(FEED_FIELDS)
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(100)
      .lean(),
    shortcutOr.length > 0
      ? ReelClip.find({ isActive: true, ...notRecentlySeen, $or: shortcutOr })
          .select(FEED_FIELDS)
          .sort({ viewCount: -1, createdAt: -1 })
          .limit(80)
          .lean()
      : Promise.resolve([]),
  ]);

  const unique = new Map<string, any>();
  [...recent, ...evergreen, ...matched].forEach((clip: any) => {
    if (unique.size < MAX_CANDIDATES) unique.set(String(clip._id), clip);
  });

  if (unique.size < 20 && recentContext.reelIds.size > 0) {
    const fallback = await ReelClip.find({ isActive: true })
      .select(FEED_FIELDS)
      .sort({ createdAt: -1, viewCount: -1 })
      .limit(60)
      .lean();
    fallback.forEach((clip: any) => {
      if (unique.size < MAX_CANDIDATES) unique.set(String(clip._id), clip);
    });
  }

  return Array.from(unique.values());
};

const comboAffinityScore = (opts: {
  mood: number;
  genre: number;
  actor: number;
  region: number;
  language: number;
  country: number;
}) => {
  const combos = [
    Math.min(opts.actor, opts.genre),
    Math.min(opts.actor, opts.mood),
    Math.min(opts.region, opts.genre),
    Math.min(opts.region, opts.mood),
    Math.min(opts.language, opts.mood),
    Math.min(opts.country, opts.genre),
  ];
  return Math.max(...combos, 0);
};

const recentRepeatPenalty = (clip: any, recentContext: RecentContext) => {
  if (recentContext.reelIds.has(String(clip._id))) return 1;
  const sameTitle = recentContext.tmdbIds.has(Number(clip.tmdbId)) ? 0.75 : 0;
  const sameActor = (clip.actorIds || []).some((id: number) => recentContext.actorIds.has(Number(id))) ? 0.35 : 0;
  return Math.max(sameTitle, sameActor);
};

const scoreClip = (clip: any, affinity: AffinityDoc, recentContext: RecentContext) => {
  const moodScores = toPlainScores(affinity.moodScores);
  const genreScores = toPlainScores(affinity.genreScores);
  const actorScores = toPlainScores(affinity.actorScores);
  const countryScores = toPlainScores(affinity.countryScores);
  const languageScores = toPlainScores(affinity.languageScores);
  const regionScores = toPlainScores(affinity.regionScores);
  const moodVocabulary = new Set(Object.keys(moodProfiles));
  const moodTags = (clip.moodTags || [])
    .map((mood: string) => mood.toLowerCase())
    .filter((mood: string) => moodVocabulary.has(mood));
  const genreIds = (clip.genreIds || []).map((id: number) => String(id));
  const actorIds = (clip.actorIds || []).map((id: number) => String(id));
  const countries = (clip.originCountries || []).map(String);
  const regions = (clip.regionTags || []).map(String);
  const languages = clip.originalLanguage ? [String(clip.originalLanguage)] : [];
  const moodAffinity = cosineForStringVector(moodTags, moodScores);
  const genreAffinity = cosineForStringVector(genreIds, genreScores);
  const actorAffinity = cosineForStringVector(actorIds, actorScores);
  const regionAffinity = cosineForStringVector(regions, regionScores);
  const languageAffinity = cosineForStringVector(languages, languageScores);
  const countryAffinity = cosineForStringVector(countries, countryScores);

  const subScores = {
    completion: rate(clip.completionRate),
    like: clipLikeRate(clip),
    tapThrough: rate(clip.tapThroughRate),
    moodAffinity,
    genreAffinity,
    actorAffinity,
    regionAffinity,
    languageAffinity,
    countryAffinity,
    comboAffinity: comboAffinityScore({
      mood: moodAffinity,
      genre: genreAffinity,
      actor: actorAffinity,
      region: regionAffinity,
      language: languageAffinity,
      country: countryAffinity,
    }),
    recency: recencyDecay(clip.createdAt),
    skipFast: rate(clip.skipFastRate),
    recentRepeat: recentRepeatPenalty(clip, recentContext),
  };

  const score =
    WEIGHTS.completion * subScores.completion +
    WEIGHTS.like * subScores.like +
    WEIGHTS.tapThrough * subScores.tapThrough +
    WEIGHTS.moodAffinity * subScores.moodAffinity +
    WEIGHTS.genreAffinity * subScores.genreAffinity +
    WEIGHTS.actorAffinity * subScores.actorAffinity +
    WEIGHTS.regionAffinity * subScores.regionAffinity +
    WEIGHTS.languageAffinity * subScores.languageAffinity +
    WEIGHTS.countryAffinity * subScores.countryAffinity +
    WEIGHTS.comboAffinity * subScores.comboAffinity +
    WEIGHTS.recency * subScores.recency -
    WEIGHTS.skipPenalty * subScores.skipFast -
    WEIGHTS.recentRepeatPenalty * subScores.recentRepeat;

  return { clip, score, subScores };
};

const wouldBreakDiversity = (candidate: any, selected: any[]) => {
  const previous = selected[selected.length - 1]?.clip;
  if (previous?.tmdbId === candidate.clip.tmdbId) return true;

  const primaryMood = candidate.clip.moodTags?.[0];
  const lastTwoMoodMatch =
    selected.length >= 2 &&
    primaryMood &&
    selected.slice(-2).every((item) => item.clip.moodTags?.[0] === primaryMood);
  if (lastTwoMoodMatch) return true;

  const primaryGenre = candidate.clip.genreIds?.[0];
  const lastThreeGenreMatch =
    selected.length >= 3 &&
    primaryGenre &&
    selected.slice(-3).every((item) => item.clip.genreIds?.[0] === primaryGenre);

  if (lastThreeGenreMatch) return true;

  const primaryRegion = candidate.clip.regionTags?.[0];
  const lastTwoRegionMatch =
    selected.length >= 2 &&
    primaryRegion &&
    selected.slice(-2).every((item) => item.clip.regionTags?.[0] === primaryRegion);

  return Boolean(lastTwoRegionMatch);
};

const diversityRerank = (ranked: any[]) => {
  const remaining = [...ranked];
  const selected: any[] = [];

  while (remaining.length > 0) {
    const index = remaining.findIndex((candidate) => !wouldBreakDiversity(candidate, selected));
    const nextIndex = index === -1 ? 0 : index;
    selected.push(remaining.splice(nextIndex, 1)[0]);
  }

  return selected;
};

const decodeCursor = (cursor?: string) => {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
};

const encodeCursor = (offset: number, total: number) =>
  offset < total ? Buffer.from(String(offset)).toString("base64url") : null;

export const ReelRankingService = {
  rankFeed: async (
    userId: string,
    cursor?: string,
    limit = 10,
    includeDebug = false,
  ) => {
    const pageSize = Math.min(Math.max(limit, 1), 20);
    const offset = decodeCursor(cursor);
    const affinity = await getAffinity(userId);
    const recentContext = await getRecentContext(userId);
    const candidates = await fetchCandidatePool(affinity || {}, recentContext);
    const ranked = diversityRerank(
      candidates
        .map((clip) => scoreClip(clip, affinity || {}, recentContext))
        .sort((a, b) => b.score - a.score),
    );
    const page = ranked.slice(offset, offset + pageSize);
    const nextCursor = encodeCursor(offset + pageSize, ranked.length);

    const items = page.map(({ clip }) => clip);
    const debug = includeDebug
      ? page.map(({ clip, score, subScores }) => ({
          reelId: clip._id,
          title: clip.title,
          score,
          subScores,
          weights: WEIGHTS,
        }))
      : undefined;

    return { items, nextCursor, debug };
  },
};
