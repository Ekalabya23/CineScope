import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ReelService } from "../services/reelService";
import { catchAsync } from "../utils/catchAsync";

export const getReelFeed = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const limit = Number(req.query.limit || 10);
    const data = await ReelService.getFeed(
      String(req.user._id),
      req.query.cursor ? String(req.query.cursor) : undefined,
      limit,
      req.user?.role === "admin" && req.query.debug === "true",
    );

    res.status(200).json({ status: "success", data });
  },
);

export const createReelClip = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const clip = await ReelService.createClip(req.body);
    res.status(201).json({ status: "success", data: clip });
  },
);

export const uploadReelClip = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const clip = await ReelService.uploadAndCreateClip(req.file, req.body);
    res.status(201).json({ status: "success", data: clip });
  },
);

export const getReelUploadSignature = catchAsync(
  async (_req: AuthenticatedRequest, res: Response) => {
    const { CloudinaryService } = await import("../services/cloudinary.service");
    const data = CloudinaryService.createReelUploadSignature();
    res.status(200).json({ status: "success", data });
  },
);

export const inferReelMoodTags = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const tmdbId = Number(req.query.tmdbId);
    const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
    const data = await ReelService.inferMoodTags(tmdbId, mediaType);

    res.status(200).json({ status: "success", data });
  },
);

export const logReelInteraction = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const interaction = await ReelService.logInteraction(
      String(req.user._id),
      req.params.id,
      req.body.action,
      Number(req.body.watchDurationMs || 0),
      Number(req.body.clipDurationMs || 0),
    );

    res.status(201).json({ status: "success", data: interaction });
  },
);

export const likeReel = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await ReelService.like(String(req.user._id), req.params.id);
    res.status(200).json({ status: "success", data });
  },
);

export const unlikeReel = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await ReelService.unlike(String(req.user._id), req.params.id);
    res.status(200).json({ status: "success", data });
  },
);

export const getReelContext = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = await ReelService.getContext(String(req.user._id), req.params.id);
    res.status(200).json({ status: "success", data });
  },
);
