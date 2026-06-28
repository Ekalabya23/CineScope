import { Types } from "mongoose";
import { MoodKey } from "../config/recommendation.config";
import { ReelClip } from "../models/reelClip.model";
import { UnifiedRecommendationEvent } from "../models/unifiedRecommendationEvent.model";
import { UserReelAffinity } from "../models/userReelAffinity.model";
import { AdaptiveRecommendationService } from "./adaptiveRecommendationService";
import { AffinityUpdateService } from "./affinityUpdateService";
import { ReelRankingService } from "./reelRankingService";

type UnifiedSignalType =
  | "watchlist_add"
  | "rating"
  | "ai_accept"
  | "ai_reject"
  | "reel_save"
  | "reel_share"
  | "reel_unlike"
  | "completion_rate"
  | "rewatch"
  | "abandon"
  | "details_dwell"
  | "reel_skip_speed"
  | "reel_full_watch"
  | "reel_replay"
  | "detail_click"
  | "trailer_click"
  | "hover"
  | "completed";

type UnifiedEventInput = {
  userId: string;
  mediaId?: number | string;
  mediaType?: "movie" | "tv" | "mixed" | "reel";
  reelId?: string;
  signalType: UnifiedSignalType | string;
  value?: number;
  sessionId?: string;
  sourceSurface?: "homepage" | "recommendations" | "reels" | "details" | "watchlist" | "ai" | "history";
  metadata?: Record<string, any>;
};

const HALF_LIFE_DAYS = 14;

const SIGNAL_WEIGHTS: Record<string, number> = {
  watchlist_add: 0.75,
  rating: 0.65,
  ai_accept: 0.7,
  ai_reject: -0.55,
  reel_save: 0.85,
  reel_share: 0.95,
  reel_unlike: -0.35,
  completion_rate: 1.15,
  rewatch: 1.25,
  abandon: -0.9,
  details_dwell: 0.45,
  reel_skip_speed: -0.95,
  reel_full_watch: 1.15,
  reel_replay: 1.2,
  detail_click: 0.55,
  trailer_click: 0.65,
  hover: 0.15,
  completed: 1,
};

const decay = (occurredAt: Date | string) => {
  const ageDays = Math.max(0, (Date.now() - new Date(occurredAt).getTime()) / 86_400_000);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
};

const weightedSignal = (event: any) =>
  Number(event.value ?? 1) * Number(SIGNAL_WEIGHTS[event.signalType] ?? 0.25) * decay(event.occurredAt);

const topKeys = (scores: Record<string, number>, limit: number) =>
  Object.entries(scores)
    .filter(([, score]) => Math.abs(score) > 0)
    .sort(([, left], [, right]) => Math.abs(right) - Math.abs(left))
    .slice(0, limit)
    .map(([key]) => key);

const addScore = (scores: Record<string, number>, key: unknown, value: number) => {
  if (!key) return;
  const normalized = String(key);
  scores[normalized] = Number(scores[normalized] || 0) + value;
};

const sessionIdFromHeaders = (metadata?: Record<string, any>) =>
  metadata?.sessionId || metadata?.clientSessionId || undefined;

const mediaTypeForAffinity = (mediaType?: string): "movie" | "tv" | "mixed" =>
  mediaType === "tv" || mediaType === "mixed" ? mediaType : "movie";

const modelPlaceholders = [
  {
    key: "collaborative-filtering-als",
    status: "dormant",
    reason: "Requires enough unified event volume before implicit matrix factorization is useful.",
  },
  {
    key: "semantic-cultural-nlp",
    status: "interface-ready",
    reason: "Will consume title overviews, keywords, and creator-review embeddings.",
  },
  {
    key: "visual-cold-start",
    status: "interface-ready",
    reason: "Will consume CLIP poster/backdrop embeddings plus synopsis embeddings.",
  },
];

export const UnifiedRecommendationEngine = {
  recordEvent: async (input: UnifiedEventInput) => {
    const sessionId = input.sessionId || sessionIdFromHeaders(input.metadata);
    const event = await UnifiedRecommendationEvent.create({
      userId: input.userId,
      mediaId: input.mediaId ? Number(input.mediaId) : undefined,
      mediaType: input.mediaType || "movie",
      reelId: input.reelId && Types.ObjectId.isValid(input.reelId) ? input.reelId : undefined,
      signalType: input.signalType,
      value: input.value ?? 1,
      sessionId,
      sourceSurface: input.sourceSurface || "recommendations",
      metadata: input.metadata || {},
      occurredAt: new Date(),
    });

    if (input.reelId) {
      const reelAction =
        input.signalType === "reel_skip_speed"
          ? "skip_fast"
          : input.signalType === "reel_save"
            ? "saved"
            : input.signalType === "reel_share"
              ? "shared"
              : input.signalType === "reel_unlike"
                ? "unliked"
              : input.signalType === "reel_full_watch" || input.signalType === "completion_rate"
                ? "watched_full"
                : undefined;

      if (reelAction) {
        AffinityUpdateService.updateFromInteraction(input.userId, input.reelId, reelAction).catch(
          () => undefined,
        );
      }
    } else if (input.mediaId) {
      const mediaSignal =
        input.signalType === "watchlist_add"
          ? "watchlist_add"
          : input.signalType === "detail_click"
            ? "detail_click"
            : input.signalType === "trailer_click"
              ? "trailer_click"
              : input.signalType === "completed" || input.signalType === "completion_rate"
                ? "completed"
                : input.signalType === "hover"
                  ? "hover"
                  : undefined;

      if (mediaSignal) {
        AffinityUpdateService.updateFromMediaInteraction(
          input.userId,
          input.mediaId,
          mediaTypeForAffinity(input.mediaType),
          mediaSignal,
          input.metadata || {},
        ).catch(() => undefined);
      }
    }

    return event;
  },

  buildSignalSnapshot: async (userId: string, limit = 800) => {
    const events = await UnifiedRecommendationEvent.find({ userId })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean();

    const genres: Record<string, number> = {};
    const actors: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const languages: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const moods: Record<string, number> = {};

    events.forEach((event: any) => {
      const value = weightedSignal(event);
      const metadata = event.metadata || {};
      (metadata.genreIds || []).forEach((genreId: number | string) => addScore(genres, genreId, value));
      (metadata.actorIds || []).forEach((actorId: number | string) => addScore(actors, actorId, value));
      (metadata.countries || metadata.originCountries || []).forEach((country: string) =>
        addScore(countries, country, value),
      );
      if (metadata.language || metadata.originalLanguage) {
        addScore(languages, metadata.language || metadata.originalLanguage, value);
      }
      (metadata.regionTags || []).forEach((region: string) => addScore(regions, region, value));
      (metadata.moods || [metadata.mood]).filter(Boolean).forEach((mood: string) => addScore(moods, mood, value));
    });

    const affinity = await UserReelAffinity.findOne({ userId }).lean();

    return {
      eventCount: events.length,
      recentSignals: events.slice(0, 25),
      topGenres: topKeys(genres, 8),
      topActors: topKeys(actors, 8),
      topCountries: topKeys(countries, 6),
      topLanguages: topKeys(languages, 6),
      topRegions: topKeys(regions, 6),
      topMoods: topKeys(moods, 6) as MoodKey[],
      affinityCache: affinity,
      halfLifeDays: HALF_LIFE_DAYS,
    };
  },

  generateHomeSections: async (userId: string, profile: any, limit = 14) => {
    const snapshot = await UnifiedRecommendationEngine.buildSignalSnapshot(userId);
    const sections = await AdaptiveRecommendationService.generateAdaptiveSections(userId, profile, limit);

    return {
      sections,
      orchestration: {
        engine: "cinescope-unified-recommendation-v4",
        layer0: {
          eventCount: snapshot.eventCount,
          halfLifeDays: snapshot.halfLifeDays,
        },
        activeModels: ["structured-graph-model-d"],
        placeholders: modelPlaceholders,
        bandit: {
          status: sections.length >= 2 ? "ready-for-arbitration" : "waiting-for-multiple-sources",
          strategy: "slot-source Thompson/LinUCB interface",
        },
      },
    };
  },

  rankReelFeed: async (
    userId: string,
    cursor?: string,
    limit = 10,
    includeDebug = false,
  ) => {
    const ranked = await ReelRankingService.rankFeed(userId, cursor, limit, includeDebug);
    const recentEvents = await UnifiedRecommendationEvent.find({
      userId,
      sourceSurface: "reels",
    })
      .sort({ occurredAt: -1 })
      .limit(10)
      .lean();

    if (!recentEvents.length) return ranked;

    const recentRegionTags = new Set(
      recentEvents.flatMap((event: any) => event.metadata?.regionTags || []),
    );
    const recentMoods = new Set(
      recentEvents.flatMap((event: any) => event.metadata?.moods || [event.metadata?.mood]).filter(Boolean),
    );

    const boostedItems = [...ranked.items].sort((left: any, right: any) => {
      const leftBoost =
        (left.regionTags || []).some((tag: string) => recentRegionTags.has(tag)) ||
        (left.moodTags || []).some((mood: string) => recentMoods.has(mood))
          ? 1
          : 0;
      const rightBoost =
        (right.regionTags || []).some((tag: string) => recentRegionTags.has(tag)) ||
        (right.moodTags || []).some((mood: string) => recentMoods.has(mood))
          ? 1
          : 0;
      return rightBoost - leftBoost;
    });

    return {
      ...ranked,
      items: boostedItems,
      debug: includeDebug
        ? {
            baseDebug: ranked.debug,
            unifiedEngine: "session-sequential-markov-v1",
            recentRegionTags: Array.from(recentRegionTags),
            recentMoods: Array.from(recentMoods),
          }
        : ranked.debug,
    };
  },

  recordReelCandidateImpression: async (userId: string, clips: any[], sessionId?: string) => {
    if (!clips.length) return;
    await UnifiedRecommendationEvent.insertMany(
      clips.map((clip) => ({
        userId,
        mediaId: clip.tmdbId,
        mediaType: "reel",
        reelId: clip._id,
        signalType: "reel_impression",
        value: 0.05,
        sessionId,
        sourceSurface: "reels",
        metadata: {
          genreIds: clip.genreIds || [],
          actorIds: clip.actorIds || [],
          originCountries: clip.originCountries || [],
          language: clip.originalLanguage,
          regionTags: clip.regionTags || [],
          moods: clip.moodTags || [],
        },
        occurredAt: new Date(),
      })),
      { ordered: false },
    ).catch(() => undefined);
  },
};
