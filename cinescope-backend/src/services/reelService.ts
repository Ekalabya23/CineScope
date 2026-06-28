import { Types } from "mongoose";
import { ReelClip } from "../models/reelClip.model";
import { ReelInteraction } from "../models/reelInteraction.model";
import { Watchlist } from "../models/watchlist.model";
import { RecommendationEngine } from "./recommendationEngine";
import { TmdbService } from "./tmdb.service";
import { CloudinaryService } from "./cloudinary.service";
import { UnifiedRecommendationEngine } from "./unifiedRecommendationEngine";
import { AppError } from "../utils/appError";
import { MoodKey } from "../config/recommendation.config";

type ReelAction = "skip_fast" | "watched_full" | "tapped_through" | "saved" | "shared" | "liked" | "unliked";

const getRegionProviders = (payload: any) => {
  const region = payload?.results?.US || payload?.results?.IN || Object.values(payload?.results || {})[0];
  return {
    link: region?.link || null,
    providers: [
      ...(region?.flatrate || []),
      ...(region?.rent || []),
      ...(region?.buy || []),
    ]
      .filter((provider: any, index: number, all: any[]) =>
        all.findIndex((item) => item.provider_id === provider.provider_id) === index,
      )
      .slice(0, 8),
  };
};

const normalizeMoodTags = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseJsonArray = <T = any>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean) as T[];
  }
};

const payloadMetadata = (payload: any) => ({
  title: String(payload.title || "").trim(),
  posterPath: payload.posterPath,
  genreIds: parseJsonArray<number>(payload.genreIds).map(Number).filter(Number.isFinite),
  actorIds: parseJsonArray<number>(payload.actorIds).map(Number).filter(Number.isFinite),
  actorNames: parseJsonArray<string>(payload.actorNames).map(String).filter(Boolean),
  originalLanguage: String(payload.originalLanguage || "").toLowerCase(),
  originCountries: parseJsonArray<string>(payload.originCountries).map(String).filter(Boolean),
  regionTags: parseJsonArray<string>(payload.regionTags).map(String).filter(Boolean),
});

const getTmdbTitleData = async (tmdbId: number, mediaType: "movie" | "tv") => {
  const details: any =
    mediaType === "tv"
      ? await TmdbService.getTvDetails(tmdbId)
      : await TmdbService.getMovieDetails(tmdbId);
  const originCountries = Array.from(
    new Set([
      ...(details?.origin_country || []),
      ...(details?.production_countries || []).map((country: any) => country.iso_3166_1),
    ].filter(Boolean)),
  );
  const originalLanguage = String(details?.original_language || "").toLowerCase();
  const actorList = (details?.credits?.cast || []).slice(0, 8);

  return {
    title: details?.title || details?.name || details?.original_title || details?.original_name,
    posterPath: details?.poster_path,
    overview: details?.overview || "",
    genres: details?.genres || [],
    genreIds: (details?.genres || []).map((genre: any) => genre.id).filter(Number.isFinite),
    actorIds: actorList.map((actor: any) => actor.id).filter(Number.isFinite),
    actorNames: actorList.map((actor: any) => actor.name).filter(Boolean),
    originalLanguage,
    originCountries,
    regionTags: inferRegionTags(originalLanguage, originCountries),
  };
};

const inferRegionTags = (language: string, countries: string[]) => {
  const normalizedCountries = new Set(countries.map((country) => country.toUpperCase()));
  const normalizedLanguage = language.toLowerCase();
  const tags = new Set<string>();

  if (normalizedCountries.has("IN") || ["hi", "te", "ta", "ml", "kn", "bn", "mr"].includes(normalizedLanguage)) {
    tags.add("bollywood");
    tags.add("indian-cinema");
  }
  if (normalizedCountries.has("KR") || normalizedLanguage === "ko") tags.add("kdrama");
  if (normalizedCountries.has("CN") || normalizedCountries.has("HK") || normalizedLanguage === "zh") tags.add("cdrama");
  if (normalizedCountries.has("JP") || normalizedLanguage === "ja") tags.add("jdrama");
  if (normalizedCountries.has("US") || normalizedLanguage === "en") tags.add("hollywood");
  if (normalizedCountries.has("TR") || normalizedLanguage === "tr") tags.add("turkish-drama");
  if (normalizedCountries.has("ES") || normalizedLanguage === "es") tags.add("spanish");

  return Array.from(tags);
};

const moodGenreWeights: Record<MoodKey, number[]> = {
  "mind-bending": [878, 9648, 53],
  emotional: [18, 10749],
  cozy: [35, 10751, 16],
  dystopian: [878, 53, 18],
  philosophical: [18, 878, 9648],
  dark: [53, 80, 27],
  uplifting: [35, 18, 10751],
  melancholic: [18, 10749],
  adrenaline: [28, 12, 53],
  cyberpunk: [878, 28, 53],
  "slow-burn": [18, 53, 9648],
};

const moodKeywordWeights: Record<MoodKey, string[]> = {
  "mind-bending": ["time", "dream", "memory", "reality", "mystery", "paradox", "mind"],
  emotional: ["love", "family", "heart", "relationship", "grief", "bond"],
  cozy: ["friend", "home", "family", "warm", "small town", "holiday"],
  dystopian: ["future", "society", "control", "surveillance", "rebel", "collapse"],
  philosophical: ["identity", "meaning", "existence", "humanity", "choice", "soul"],
  dark: ["crime", "murder", "killer", "revenge", "evil", "haunted", "violent"],
  uplifting: ["hope", "dream", "triumph", "journey", "inspire", "chance"],
  melancholic: ["loss", "memory", "past", "lonely", "farewell", "longing"],
  adrenaline: ["mission", "battle", "fight", "survive", "war", "chase"],
  cyberpunk: ["android", "technology", "corporation", "cyber", "neon", "synthetic"],
  "slow-burn": ["secret", "investigation", "quiet", "tension", "unravel", "hidden"],
};

const inferMoodTagsFromDetails = (details: {
  title?: string;
  overview?: string;
  genres?: Array<{ id?: number; name?: string }>;
}) => {
  const genreIds = new Set((details.genres || []).map((genre) => genre.id).filter(Boolean));
  const haystack = `${details.title || ""} ${details.overview || ""}`.toLowerCase();

  const ranked = (Object.keys(moodGenreWeights) as MoodKey[])
    .map((mood) => {
      const genreScore = moodGenreWeights[mood].filter((genreId) => genreIds.has(genreId)).length * 4;
      const keywordScore = moodKeywordWeights[mood].filter((word) => haystack.includes(word)).length * 2;
      return { mood, score: genreScore + keywordScore };
    })
    .sort((a, b) => b.score - a.score);

  const selected = ranked.filter((item) => item.score > 0).slice(0, 3).map((item) => item.mood);
  if (selected.length >= 2) return selected;

  const fallback = (details.genres || []).some((genre) => genre.id === 28 || genre.id === 12)
    ? ["adrenaline", "uplifting"]
    : (details.genres || []).some((genre) => genre.id === 10749)
      ? ["emotional", "melancholic"]
      : ["mind-bending", "slow-burn"];

  return Array.from(new Set([...selected, ...fallback])).slice(0, 3);
};

const generateVibeLabelFromDetails = (details: {
  title?: string;
  overview?: string;
  genres?: Array<{ id?: number; name?: string }>;
  moodTags?: string[];
  regionTags?: string[];
  mediaType?: "movie" | "tv";
}) => {
  const genreNames = (details.genres || [])
    .map((genre) => genre.name?.toLowerCase())
    .filter(Boolean);
  const moods = details.moodTags || inferMoodTagsFromDetails(details);
  const overview = `${details.title || ""} ${details.overview || ""}`.toLowerCase();
  const primaryMood = moods[0] || "cinematic";
  const region = details.regionTags?.[0];

  const templates: Array<[boolean, string]> = [
    [
      primaryMood === "adrenaline" || genreNames.includes("action"),
      region === "bollywood" ? "high-energy mass action" : "pulse-racing action stakes",
    ],
    [
      primaryMood === "emotional" || genreNames.includes("romance"),
      "heartfelt romantic drama",
    ],
    [
      primaryMood === "melancholic" || overview.includes("loss") || overview.includes("memory"),
      "bittersweet emotional longing",
    ],
    [
      primaryMood === "dark" || genreNames.includes("crime") || genreNames.includes("horror"),
      "dark tension and danger",
    ],
    [
      primaryMood === "mind-bending" || genreNames.includes("science fiction") || overview.includes("time"),
      "reality-bending mystery",
    ],
    [
      primaryMood === "dystopian" || overview.includes("future") || overview.includes("society"),
      "dystopian survival pressure",
    ],
    [
      primaryMood === "cozy" || genreNames.includes("comedy") || genreNames.includes("family"),
      "warm comfort-watch energy",
    ],
    [
      primaryMood === "slow-burn" || genreNames.includes("mystery") || genreNames.includes("thriller"),
      "slow-burn suspense hook",
    ],
    [
      primaryMood === "philosophical",
      "thoughtful identity drama",
    ],
    [
      primaryMood === "uplifting",
      "hopeful feel-good momentum",
    ],
  ];

  const match = templates.find(([condition]) => condition)?.[1];
  if (match) return match;
  if (region === "kdrama") return "addictive k-drama emotions";
  if (region === "cdrama") return "sweeping c-drama intrigue";
  if (details.mediaType === "tv") return "binge-worthy series moment";
  return "cinematic discovery moment";
};

export const ReelService = {
  getFeed: async (
    userId: string,
    cursor?: string,
    limit = 10,
    includeDebug = false,
  ) => {
    const rankedFeed = await UnifiedRecommendationEngine.rankReelFeed(userId, cursor, limit, includeDebug);
    const items = rankedFeed.items;
    const liked = await ReelInteraction.find({
      userId,
      action: "liked",
      reelId: { $in: items.map((item: any) => item._id) },
    })
      .select("reelId")
      .lean();
    const likedIds = new Set(liked.map((item: any) => String(item.reelId)));
    const hydratedItems = items.map((item: any) => ({
      ...item,
      isLiked: likedIds.has(String(item._id)),
    }));

    ReelClip.updateMany(
      { _id: { $in: hydratedItems.map((item: any) => item._id) } },
      { $inc: { viewCount: 1 } },
    ).catch(() => undefined);
    UnifiedRecommendationEngine.recordReelCandidateImpression(userId, hydratedItems).catch(
      () => undefined,
    );

    return { items: hydratedItems, nextCursor: rankedFeed.nextCursor, debug: rankedFeed.debug };
  },

  createClip: async (payload: any) => {
    if (!/^https:\/\/res\.cloudinary\.com\//.test(payload.videoUrl || "")) {
      throw new AppError("Reel videos must be hosted as HTTPS Cloudinary assets.", 400);
    }

    const providedMetadata = payloadMetadata(payload);
    const hasEnoughMetadata =
      providedMetadata.title &&
      providedMetadata.genreIds.length > 0 &&
      providedMetadata.actorIds.length > 0;
    const tmdbData = hasEnoughMetadata
      ? {
          ...providedMetadata,
          overview: "",
          genres: [],
          regionTags:
            providedMetadata.regionTags.length > 0
              ? providedMetadata.regionTags
              : inferRegionTags(providedMetadata.originalLanguage, providedMetadata.originCountries),
        }
      : await getTmdbTitleData(Number(payload.tmdbId), payload.mediaType === "tv" ? "tv" : "movie");

    return ReelClip.create({
      videoUrl: payload.videoUrl,
      cloudinaryPublicId: payload.cloudinaryPublicId,
      thumbnailUrl:
        payload.thumbnailUrl ||
        (payload.cloudinaryPublicId
          ? CloudinaryService.reelThumbnailUrl(payload.cloudinaryPublicId)
          : undefined),
      durationMs: payload.durationMs,
      tmdbId: payload.tmdbId,
      mediaType: payload.mediaType,
      title: payload.title || tmdbData.title,
      posterPath: payload.posterPath || tmdbData.posterPath,
      genreIds: payload.genreIds || tmdbData.genreIds,
      actorIds: payload.actorIds || tmdbData.actorIds,
      actorNames: payload.actorNames || tmdbData.actorNames,
      originalLanguage: payload.originalLanguage || tmdbData.originalLanguage,
      originCountries: payload.originCountries || tmdbData.originCountries,
      regionTags: payload.regionTags || tmdbData.regionTags,
      moodTags: payload.moodTags || [],
      vibeLabel:
        payload.vibeLabel ||
        generateVibeLabelFromDetails({
          title: tmdbData.title,
          overview: tmdbData.overview,
          genres: tmdbData.genres,
          moodTags: payload.moodTags,
          regionTags: tmdbData.regionTags,
          mediaType: payload.mediaType === "tv" ? "tv" : "movie",
        }),
      isActive: payload.isActive ?? true,
      priority: payload.priority ?? 0,
    });
  },

  uploadAndCreateClip: async (file: Express.Multer.File | undefined, payload: any) => {
    if (!file) throw new AppError("A reel video file is required.", 400);
    if (!file.mimetype.startsWith("video/")) {
      throw new AppError("Only video files can be uploaded as reels.", 400);
    }

    const tmdbId = Number(payload.tmdbId);
    const mediaType = payload.mediaType === "tv" ? "tv" : "movie";
    if (!Number.isFinite(tmdbId)) {
      throw new AppError("A valid TMDB ID is required.", 400);
    }

    const providedMetadata = payloadMetadata(payload);
    const hasEnoughMetadata =
      providedMetadata.title &&
      providedMetadata.genreIds.length > 0 &&
      providedMetadata.actorIds.length > 0;
    const tmdbData = hasEnoughMetadata
      ? {
          ...providedMetadata,
          overview: "",
          genres: [],
          regionTags:
            providedMetadata.regionTags.length > 0
              ? providedMetadata.regionTags
              : inferRegionTags(providedMetadata.originalLanguage, providedMetadata.originCountries),
        }
      : await getTmdbTitleData(tmdbId, mediaType);
    const moodTags = normalizeMoodTags(payload.moodTags);
    const finalMoodTags =
      moodTags.length > 0
        ? moodTags.slice(0, 3)
        : inferMoodTagsFromDetails({
            title: tmdbData.title,
            overview: tmdbData.overview,
            genres: tmdbData.genres,
          });
    const title = String(providedMetadata.title || tmdbData.title || "").trim();
    const vibeLabel = String(
      payload.vibeLabel ||
        generateVibeLabelFromDetails({
          title: tmdbData.title,
          overview: tmdbData.overview,
          genres: tmdbData.genres,
          moodTags: finalMoodTags,
          regionTags: tmdbData.regionTags,
          mediaType,
        }),
    ).trim();

    if (!title) throw new AppError("Unable to resolve a title for this TMDB ID.", 400);
    if (!vibeLabel) throw new AppError("A short vibe label is required.", 400);

    const upload = await CloudinaryService.uploadReelVideo(file.buffer, file.originalname, {
      tmdbId,
      mediaType,
      title,
      moodTags: finalMoodTags,
      vibeLabel,
    });

    const durationMs = upload.duration
      ? Math.round(Number(upload.duration) * 1000)
      : Math.max(Number(payload.durationMs || payload.duration || 1000), 1000);

    return ReelClip.create({
      videoUrl: upload.secure_url,
      cloudinaryPublicId: upload.public_id,
      thumbnailUrl: payload.thumbnailUrl || CloudinaryService.reelThumbnailUrl(upload.public_id),
      durationMs,
      tmdbId,
      mediaType,
      title,
      posterPath: payload.posterPath || tmdbData.posterPath,
      genreIds: tmdbData.genreIds,
      actorIds: tmdbData.actorIds,
      actorNames: tmdbData.actorNames,
      originalLanguage: tmdbData.originalLanguage,
      originCountries: tmdbData.originCountries,
      regionTags: tmdbData.regionTags,
      moodTags: finalMoodTags,
      vibeLabel,
      isActive: payload.isActive !== "false",
      priority: Number(payload.priority || 0),
    });
  },

  inferMoodTags: async (tmdbId: number, mediaType: "movie" | "tv") => {
    const details = await getTmdbTitleData(tmdbId, mediaType);
    return {
      title: details.title,
      posterPath: details.posterPath,
      genreIds: details.genreIds,
      actorIds: details.actorIds,
      actorNames: details.actorNames,
      originalLanguage: details.originalLanguage,
      originCountries: details.originCountries,
      regionTags: details.regionTags,
      moodTags: inferMoodTagsFromDetails(details),
      vibeLabel: generateVibeLabelFromDetails({
        title: details.title,
        overview: details.overview,
        genres: details.genres,
        regionTags: details.regionTags,
        mediaType,
      }),
    };
  },

  backfillMetadata: async () => {
    const clips = await ReelClip.find({
      $or: [
        { genreIds: { $exists: false } },
        { genreIds: { $size: 0 } },
        { actorIds: { $exists: false } },
        { actorIds: { $size: 0 } },
        { regionTags: { $exists: false } },
        { regionTags: { $size: 0 } },
        { originalLanguage: { $in: [null, ""] } },
      ],
    })
      .select("_id tmdbId mediaType moodTags")
      .limit(200);

    let updatedCount = 0;
    for (const clip of clips) {
      const details = await getTmdbTitleData(clip.tmdbId, clip.mediaType);
      await ReelClip.findByIdAndUpdate(clip._id, {
        genreIds: details.genreIds,
        actorIds: details.actorIds,
        actorNames: details.actorNames,
        originalLanguage: details.originalLanguage,
        originCountries: details.originCountries,
        regionTags: details.regionTags,
        moodTags:
          clip.moodTags?.length > 0
            ? clip.moodTags
            : inferMoodTagsFromDetails(details),
      });
      updatedCount += 1;
    }

    return updatedCount;
  },

  logInteraction: async (
    userId: string,
    reelId: string,
    action: ReelAction,
    watchDurationMs = 0,
    clipDurationMs?: number,
  ) => {
    if (!Types.ObjectId.isValid(reelId)) {
      throw new AppError("Invalid reel clip identifier.", 400);
    }

    const clip = await ReelClip.findById(reelId)
      .select("durationMs tmdbId mediaType genreIds actorIds originCountries originalLanguage regionTags moodTags")
      .lean();
    if (!clip) throw new AppError("Reel clip not found.", 404);

    const interaction = await ReelInteraction.create({
      userId,
      reelId,
      action,
      watchDurationMs,
      clipDurationMs: clipDurationMs || clip.durationMs || 0,
    });

    const signalType =
      action === "skip_fast"
        ? "reel_skip_speed"
        : action === "saved"
          ? "reel_save"
          : action === "shared"
            ? "reel_share"
            : action === "watched_full" || action === "tapped_through"
              ? "reel_full_watch"
              : action === "liked"
                ? "reel_save"
                : "reel_skip_speed";
    UnifiedRecommendationEngine.recordEvent({
      userId,
      mediaId: clip.tmdbId,
      mediaType: "reel",
      reelId,
      signalType,
      value:
        action === "skip_fast"
          ? Math.max(0.1, 1 - watchDurationMs / Math.max(clip.durationMs || 1, 1))
          : Math.max(1, watchDurationMs / Math.max(clip.durationMs || 1, 1)),
      sourceSurface: "reels",
      metadata: {
        genreIds: clip.genreIds || [],
        actorIds: clip.actorIds || [],
        originCountries: clip.originCountries || [],
        language: clip.originalLanguage,
        regionTags: clip.regionTags || [],
        moods: clip.moodTags || [],
      },
    }).catch(() => undefined);

    return interaction;
  },

  like: async (userId: string, reelId: string) => {
    if (!Types.ObjectId.isValid(reelId)) {
      throw new AppError("Invalid reel clip identifier.", 400);
    }

    const clip = await ReelClip.findById(reelId)
      .select("_id likeCount durationMs tmdbId mediaType genreIds actorIds originCountries originalLanguage regionTags moodTags")
      .lean();
    if (!clip) throw new AppError("Reel clip not found.", 404);

    const existing = await ReelInteraction.findOne({
      userId,
      reelId,
      action: "liked",
    });

    if (existing) {
      return { isLiked: true, likeCount: clip.likeCount || 0 };
    }

    try {
      await ReelInteraction.create({
      userId,
      reelId,
      action: "liked",
      watchDurationMs: 0,
      clipDurationMs: clip.durationMs || 0,
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      return { isLiked: true, likeCount: clip.likeCount || 0 };
    }

    const updated = await ReelClip.findByIdAndUpdate(
      reelId,
      { $inc: { likeCount: 1 } },
      { new: true },
    ).select("likeCount");
    UnifiedRecommendationEngine.recordEvent({
      userId,
      mediaId: clip.tmdbId,
      mediaType: "reel",
      reelId,
      signalType: "reel_save",
      value: 1,
      sourceSurface: "reels",
      metadata: {
        genreIds: clip.genreIds || [],
        actorIds: clip.actorIds || [],
        originCountries: clip.originCountries || [],
        language: clip.originalLanguage,
        regionTags: clip.regionTags || [],
        moods: clip.moodTags || [],
      },
    }).catch(() => undefined);

    return { isLiked: true, likeCount: updated?.likeCount || 1 };
  },

  unlike: async (userId: string, reelId: string) => {
    if (!Types.ObjectId.isValid(reelId)) {
      throw new AppError("Invalid reel clip identifier.", 400);
    }

    const clip = await ReelClip.findById(reelId)
      .select("_id likeCount durationMs tmdbId mediaType genreIds actorIds originCountries originalLanguage regionTags moodTags")
      .lean();
    if (!clip) throw new AppError("Reel clip not found.", 404);

    const existing = await ReelInteraction.findOneAndDelete({
      userId,
      reelId,
      action: "liked",
    });

    if (!existing) {
      return { isLiked: false, likeCount: clip.likeCount || 0 };
    }

    await ReelInteraction.create({
      userId,
      reelId,
      action: "unliked",
      watchDurationMs: 0,
      clipDurationMs: clip.durationMs || 0,
    });
    const updated = await ReelClip.findByIdAndUpdate(
      reelId,
      { $inc: { likeCount: -1 } },
      { new: true },
    ).select("likeCount");
    UnifiedRecommendationEngine.recordEvent({
      userId,
      mediaId: clip.tmdbId,
      mediaType: "reel",
      reelId,
      signalType: "reel_unlike",
      value: 1,
      sourceSurface: "reels",
      metadata: {
        genreIds: clip.genreIds || [],
        actorIds: clip.actorIds || [],
        originCountries: clip.originCountries || [],
        language: clip.originalLanguage,
        regionTags: clip.regionTags || [],
        moods: clip.moodTags || [],
      },
    }).catch(() => undefined);

    return { isLiked: false, likeCount: Math.max(updated?.likeCount || 0, 0) };
  },

  getContext: async (userId: string, reelId: string) => {
    if (!Types.ObjectId.isValid(reelId)) {
      throw new AppError("Invalid reel clip identifier.", 400);
    }

    const clip = await ReelClip.findById(reelId).lean();
    if (!clip) throw new AppError("Reel clip not found.", 404);

    const [providersRaw, similarRaw, watchlistItem] = await Promise.all([
      TmdbService.getWatchProviders(clip.tmdbId, clip.mediaType),
      RecommendationEngine.getSimilarRecommendations(userId, String(clip.tmdbId), clip.mediaType),
      Watchlist.findOne({ userId, mediaId: clip.tmdbId, mediaType: clip.mediaType }).lean(),
    ]);

    return {
      clip,
      streaming: getRegionProviders(providersRaw),
      similar: similarRaw.items.slice(0, 3),
      watchlist: { isSaved: Boolean(watchlistItem), itemId: watchlistItem?._id || null },
    };
  },
};
