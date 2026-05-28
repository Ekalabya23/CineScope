import { Request, Response } from "express";
import { SuggestionsService } from "../services/suggestions.service";
import { catchAsync } from "../utils/catchAsync";

export const getSuggestions = catchAsync(
  async (req: Request, res: Response) => {
    const q = String(req.query?.q || "").trim();

    if (!q || q.length < 2) {
      return res.status(200).json({
        status: "success",
        results: [],
      });
    }

    const results = await SuggestionsService.getSuggestions(q);

    return res.status(200).json({
      status: "success",
      results,
    });
  },
);
