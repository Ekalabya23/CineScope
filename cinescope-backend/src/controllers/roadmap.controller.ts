import { Request, Response } from "express";
import { RoadmapEngine } from "../services/roadmapEngine";
import { catchAsync } from "../utils/catchAsync";

export const generateRoadmap = catchAsync(async (req: Request, res: Response) => {
  const title = String(req.body?.query || req.body?.title || "").trim();

  if (!title) {
    return res.status(400).json({
      status: "fail",
      message: "Roadmap generation requires a query.",
    });
  }

  const data = await RoadmapEngine.generate(title);

  res.status(200).json({
    status: "success",
    data,
  });
});
