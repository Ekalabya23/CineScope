import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Watchlist } from "../models/watchlist.model";
import { catchAsync } from "../utils/catchAsync";

export const getWatchlist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const list = await Watchlist.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res
      .status(200)
      .json({ status: "success", results: list.length, data: list });
  },
);

export const addToWatchlist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { mediaId, title, posterPath, mediaType } = req.body;

    const item = await Watchlist.create({
      userId: req.user._id,
      mediaId,
      title,
      posterPath,
      mediaType,
    });

    res.status(201).json({ status: "success", data: item });
  },
);

export const removeFromWatchlist = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params; // TMDB Media ID
    await Watchlist.findOneAndDelete({ userId: req.user._id, mediaId: id });
    res.status(204).json({ status: "success", data: null });
  },
);
