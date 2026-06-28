import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { HomepageService } from "../services/homepageService";
import { DiscoveryService } from "../services/discoveryService";
import { PersonalizationEngine } from "../services/personalizationEngine";
import { TasteProfileService } from "../services/tasteProfileService";
import { RecommendationEngine } from "../services/recommendationEngine";
import { UserHistory } from "../models/userHistory.model";
import { RecommendationAnalytics } from "../models/recommendationAnalytics.model";
import { UserProfileService } from "../services/userProfileService";
import { UnifiedRecommendationEngine } from "../services/unifiedRecommendationEngine";
import { catchAsync } from "../utils/catchAsync";

export const getHomepage = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await HomepageService.generateHomepage(String(req.user._id));
    res.status(200).json({ status: "success", data });
  },
);

export const getMoodDiscovery = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const mood = String(req.query.mood || "mind-bending");
    const page = Number(req.query.page || 1);
    const profile = await TasteProfileService.generateTasteProfile(String(req.user._id));
    const data = await DiscoveryService.discoverByMood(mood, profile, page);
    res.status(200).json({ status: "success", data });
  },
);

export const getPersonalizedRecommendations = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await PersonalizationEngine.generatePersonalizedRecommendations(
      String(req.user._id),
    );
    res.status(200).json({ status: "success", data });
  },
);

export const getTasteProfile = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await TasteProfileService.generateTasteProfile(String(req.user._id));
    res.status(200).json({ status: "success", data });
  },
);

export const getUserProfile = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await UserProfileService.getProfile(String(req.user._id));
    res.status(200).json({ status: "success", data });
  },
);

export const updateUserProfile = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await UserProfileService.updateProfile(String(req.user._id), req.body);
    res.status(200).json({ status: "success", data });
  },
);

export const getUserAnalytics = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await UserProfileService.getAnalytics(String(req.user._id));
    res.status(200).json({ status: "success", data });
  },
);

export const getHistory = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await UserProfileService.getHistory(String(req.user._id));
    res.status(200).json({ status: "success", results: data.length, data });
  },
);

export const getContinueWatching = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await UserHistory.find({
      userId: req.user._id,
      progressPercentage: { $gt: 0, $lt: 95 },
    })
      .sort({ lastViewedAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ status: "success", results: data.length, data });
  },
);

export const upsertProgress = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      mediaId,
      mediaType,
      title,
      posterPath,
      backdropPath,
      season,
      episode,
      playbackTimestamp,
      progressPercentage,
      genres,
      moods,
      themes,
    } = req.body;

    const data = await UserHistory.findOneAndUpdate(
      { userId: req.user._id, mediaId, mediaType },
      {
        userId: req.user._id,
        mediaId,
        mediaType,
        title,
        posterPath,
        backdropPath,
        season,
        episode,
        playbackTimestamp,
        progressPercentage,
        completed: Number(progressPercentage) >= 95,
        lastViewedAt: new Date(),
        genres,
        moods,
        themes,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (Number(progressPercentage) >= 95) {
      UnifiedRecommendationEngine.recordEvent({
        userId: String(req.user._id),
        mediaId,
        mediaType,
        signalType: "completed",
        sourceSurface: "history",
        metadata: { moods, mood: moods?.[0], genres, themes },
      }).catch(() => undefined);
    }

    res.status(200).json({ status: "success", data });
  },
);

export const trackInteraction = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await RecommendationAnalytics.create({
      userId: req.user._id,
      ...req.body,
    });

    UnifiedRecommendationEngine.recordEvent({
      userId: String(req.user._id),
      mediaId: req.body.mediaId,
      mediaType: req.body.mediaType || "movie",
      signalType: req.body.interactionType,
      value: req.body.value ?? 1,
      sessionId: req.body.sessionId,
      sourceSurface: req.body.sourceSurface || "recommendations",
      metadata: {
        ...(req.body.metadata || {}),
        mood: req.body.mood,
      },
    }).catch(() => undefined);

    res.status(201).json({ status: "success", data });
  },
);

export const getSimilarRecommendations = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await RecommendationEngine.getSimilarRecommendations(
      String(req.user._id),
      req.params.id,
      String(req.query.type || "movie"),
    );
    res.status(200).json({ status: "success", data });
  },
);
