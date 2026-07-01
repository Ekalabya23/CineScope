import { GroqService } from "../ai/groq.service";
import { TmdbService } from "./tmdb.service";
import { NarrativeProgressionEngine } from "./narrativeProgressionEngine";

export type RoadmapMode =
  | "Essential Only"
  | "Full Experience"
  | "Chronological"
  | "Release Order"
  | "Character Journey"
  | "Emotional Arc";

export type RoadmapPayload = {
  title: string;
  detectedTitle: string;
  franchise: string;
  normalizedQuery: string;
  matchedTitle: string;
  detectedUniverse: string;
  confidence: number;
  canonAccuracy: number;
  continuityConfidence: number;
  franchiseAccuracy: number;
  franchiseMatchScore: number;
  validationWarnings: string[];
  correctionReason?: string;
  recommendedMode: RoadmapMode;
  availableModes: RoadmapMode[];
  watchOrder: any[];
  essentialViewing: RoadmapViewingItem[];
  recommendedViewing: RoadmapViewingItem[];
  optionalViewing: RoadmapViewingItem[];
  emotionalArc: string[];
  continuityInsight: string;
  aiSummary: string;
  narrativeProgression: ReturnType<typeof NarrativeProgressionEngine.build>;
};

export type RoadmapViewingItem = {
  id: string;
  title: string;
  year?: string;
  importanceLevel: "Essential" | "Recommended" | "Optional";
  continuityExplanation: string;
  emotionalRelevance: string;
  required: boolean;
  posterPath?: string;
  mediaType: "movie" | "tv";
  importanceScore: number;
};

const modes: RoadmapMode[] = [
  "Essential Only",
  "Full Experience",
  "Chronological",
  "Release Order",
  "Character Journey",
  "Emotional Arc",
];

const mapGroqItemToTmdb = async (
  item: any,
  importanceLevel: "Essential" | "Recommended" | "Optional",
  required: boolean
): Promise<RoadmapViewingItem | null> => {
  try {
    const searchResults = await TmdbService.searchMulti(item.title);
    const bestMatch = searchResults.find(
      (res: any) =>
        (res.media_type === "movie" || res.media_type === "tv") &&
        (!item.year || res.release_date?.startsWith(item.year) || res.first_air_date?.startsWith(item.year))
    ) || searchResults.find((res: any) => res.media_type === "movie" || res.media_type === "tv");

    if (!bestMatch) {
      return null;
    }

    return {
      id: bestMatch.id.toString(),
      title: bestMatch.title || bestMatch.name,
      year: (bestMatch.release_date || bestMatch.first_air_date)?.substring(0, 4) || item.year,
      importanceLevel,
      continuityExplanation: item.explanation || "",
      emotionalRelevance: item.emotionalRelevance || "",
      required,
      posterPath: bestMatch.poster_path,
      mediaType: bestMatch.media_type as "movie" | "tv",
      importanceScore: Math.round((bestMatch.vote_average || 0) * 10),
    };
  } catch (error) {
    console.error(`[CineScope] Failed to map ${item.title} to TMDB`, error);
    return null;
  }
};

export const RoadmapEngine = {
  generate: async (query: string): Promise<RoadmapPayload> => {
    // Step 1: Find the target on TMDB
    const searchResults = await TmdbService.searchMulti(query);
    const target = searchResults.find((res: any) => res.media_type === "movie" || res.media_type === "tv");

    if (!target) {
      throw new Error("Could not find matching movie or TV show on TMDB.");
    }

    const targetTitle = target.title || target.name;
    const targetYear = (target.release_date || target.first_air_date)?.substring(0, 4) || "";
    
    // Step 2: Generate Dynamic JSON with Groq
    const groqRoadmap = await GroqService.generateDynamicRoadmap(targetTitle, targetYear, target.media_type);

    if (!groqRoadmap || !groqRoadmap.essentialViewing) {
      throw new Error("Failed to generate dynamic roadmap from AI.");
    }

    const targetIncluded = groqRoadmap.essentialViewing.some((item: any) =>
      item.title?.toLowerCase().includes(targetTitle.toLowerCase()) || targetTitle.toLowerCase().includes(item.title?.toLowerCase() || "")
    );

    if (!targetIncluded) {
      groqRoadmap.essentialViewing.push({
        title: targetTitle,
        year: targetYear,
        explanation: `The focal point and conclusion of this roadmap.`,
        emotionalRelevance: "culmination"
      });
    }

    // Step 3: Map Groq recommendations back to TMDB concurrently
    const [essential, recommended, optional] = await Promise.all([
      Promise.all((groqRoadmap.essentialViewing || []).map((item: any) => mapGroqItemToTmdb(item, "Essential", true))),
      Promise.all((groqRoadmap.recommendedViewing || []).map((item: any) => mapGroqItemToTmdb(item, "Recommended", false))),
      Promise.all((groqRoadmap.optionalViewing || []).map((item: any) => mapGroqItemToTmdb(item, "Optional", false))),
    ]);

    const sortByYear = (a: RoadmapViewingItem, b: RoadmapViewingItem) => {
      const yearA = parseInt(a.year || "9999", 10);
      const yearB = parseInt(b.year || "9999", 10);
      return yearA - yearB;
    };

    const essentialViewing = (essential.filter(Boolean) as RoadmapViewingItem[]).sort(sortByYear);
    const recommendedViewing = (recommended.filter(Boolean) as RoadmapViewingItem[]).sort(sortByYear);
    const optionalViewing = (optional.filter(Boolean) as RoadmapViewingItem[]).sort(sortByYear);

    const allNodes = [...essentialViewing, ...recommendedViewing, ...optionalViewing].sort(sortByYear);

    const watchOrderNodes = allNodes.map((item) => ({
      id: item.id,
      title: item.title,
      mediaType: item.mediaType,
      posterPath: item.posterPath,
      releaseYear: item.year,
      chronologyIndex: parseInt(item.year || "9999", 10),
      releaseIndex: parseInt(item.year || "9999", 10),
      importanceScore: item.importanceScore,
      requirement: item.required ? "required" : "optional",
      aiExplanation: item.continuityExplanation,
      emotionalRelevance: item.emotionalRelevance,
      continuitySignificance: item.continuityExplanation,
    }));

    const fallbackProgression = NarrativeProgressionEngine.build(
      watchOrderNodes,
      targetTitle,
    );

    return {
      title: targetTitle,
      detectedTitle: targetTitle,
      franchise: groqRoadmap.universe || "Cinematic Universe",
      normalizedQuery: query,
      matchedTitle: targetTitle,
      detectedUniverse: groqRoadmap.universe || "Cinematic Universe",
      confidence: 90,
      canonAccuracy: 95,
      continuityConfidence: 90,
      franchiseAccuracy: 90,
      franchiseMatchScore: 90,
      validationWarnings: [],
      correctionReason: undefined,
      recommendedMode: "Essential Only",
      availableModes: modes,
      watchOrder: watchOrderNodes,
      essentialViewing,
      recommendedViewing,
      optionalViewing,
      emotionalArc: groqRoadmap.emotionalArc || [],
      continuityInsight: groqRoadmap.aiSummary || `Dynamically generated roadmap for ${targetTitle}.`,
      aiSummary: groqRoadmap.aiSummary || `Dynamically generated roadmap for ${targetTitle}.`,
      narrativeProgression: fallbackProgression,
    };
  },
};
