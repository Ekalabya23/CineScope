import { Request, Response } from "express";
import { TmdbService } from "../services/tmdb.service";
import { BrowseService } from "../services/browseService";
import { HomepageService } from "../services/homepageService";
import { CreatorInsightService } from "../services/creatorInsightService";
import { catchAsync } from "../utils/catchAsync";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getBrowseCollections = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    // Dispatches straight to the automated engine layout config mapper
    const layoutPayload = req.user?._id
      ? await HomepageService.generateHomepage(String(req.user._id))
      : await BrowseService.generateDiscoveryLayout();

    res.status(200).json({
      status: "success",
      data: layoutPayload,
    });
  },
);

export const getMediaDetails = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type } = req.query; // 'movie' or 'tv'

    const data =
      type === "tv"
        ? await TmdbService.getTvDetails(id)
        : await TmdbService.getMovieDetails(id);

    res.status(200).json({ status: "success", data });
  },
);

export const getCreatorInsights = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const type = req.query.type === "tv" ? "tv" : "movie";
    const data = await CreatorInsightService.buildForMedia(id, type);

    res.status(200).json({ status: "success", data });
  },
);
