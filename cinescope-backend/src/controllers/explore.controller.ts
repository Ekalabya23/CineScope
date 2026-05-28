import { Request, Response } from "express";
import { ExploreService } from "../services/exploreService";
import { CANONICAL_UNIVERSES, getCanonicalUniverseByName } from "../services/canonicalUniverseDatabase";
import { TmdbService } from "../services/tmdb.service";
import { catchAsync } from "../utils/catchAsync";

const getYear = (item: any) =>
  String(item.release_date || item.first_air_date || "").slice(0, 4) || undefined;

// Enrich entries with poster and validated details from TMDB
const enrichEntry = async (entry: any) => {
  try {
    const searchResults = await TmdbService.searchMulti(entry.tmdbQuery || entry.title).catch(() => []);
    const match = searchResults.find((item: any) => item.media_type === "movie" || item.media_type === "tv") || {};
    return {
      ...entry,
      posterPath: match.poster_path || "",
      releaseYear: entry.releaseYear || getYear(match) || ""
    };
  } catch (err) {
    return {
      ...entry,
      posterPath: "",
      releaseYear: entry.releaseYear || ""
    };
  }
};

export const getUniverseList = catchAsync(async (req: Request, res: Response) => {
  const list = ExploreService.getUniverseList();
  res.status(200).json({
    status: "success",
    data: list
  });
});

export const getUniverseDetails = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const staticData = ExploreService.getUniverseData(id);

  if (!staticData) {
    return res.status(404).json({
      status: "fail",
      message: `Universe ${id} not found.`
    });
  }

  // Get canonical universe entries
  const canonicalUniv = CANONICAL_UNIVERSES.find((u) => u.id.toLowerCase() === id.toLowerCase());
  const rawEntries = canonicalUniv ? canonicalUniv.entries : [];

  // Enrich timeline entries with TMDB poster images and release years
  const enrichedEntries = await Promise.all(rawEntries.map((entry) => enrichEntry(entry)));

  res.status(200).json({
    status: "success",
    data: {
      ...staticData,
      timeline: enrichedEntries
    }
  });
});

export const getAiStoryIntelligence = catchAsync(async (req: Request, res: Response) => {
  const universe = String(req.body?.universe || "Marvel").trim();
  const focus = String(req.body?.focus || "Infinity Saga").trim();

  if (!focus) {
    return res.status(400).json({
      status: "fail",
      message: "AI storyline intelligence requires a focal point."
    });
  }

  const aiIntelligence = await ExploreService.generateAiStorylineIntelligence({ universe, focus });

  res.status(200).json({
    status: "success",
    data: aiIntelligence
  });
});
