import { TmdbService } from "./tmdb.service";
import { ContinuityBlueprint } from "./continuityAnalyzer";
import { CanonicalEntry } from "./canonicalUniverseDatabase";

export type RoadmapMode =
  | "Essential Only"
  | "Full Experience"
  | "Chronological"
  | "Release Order"
  | "Character Journey"
  | "Emotional Arc";

export type RoadmapNode = {
  id: string;
  title: string;
  mediaType: "movie" | "tv";
  posterPath?: string;
  releaseYear?: string;
  chronologyIndex?: number;
  releaseIndex?: number;
  importanceScore: number;
  requirement: "required" | "optional";
  aiExplanation: string;
  emotionalRelevance: string;
  continuitySignificance: string;
};

const getYear = (item: any) =>
  String(item.release_date || item.first_air_date || "").slice(0, 4) || undefined;

const toRoadmapMediaType = (mediaType: CanonicalEntry["mediaType"]): "movie" | "tv" =>
  mediaType === "movie" ? "movie" : "tv";

const enrichCanonicalEntry = async (
  entry: CanonicalEntry,
  requirement: "required" | "optional",
): Promise<RoadmapNode> => {
  const results = await TmdbService.searchMulti(entry.tmdbQuery || entry.title).catch(() => []);
  const match =
    results.find((item: any) => item.media_type === "movie" || item.media_type === "tv") ||
    {};

  return {
    id: entry.id,
    title: entry.title,
    mediaType: toRoadmapMediaType(entry.mediaType),
    posterPath: match.poster_path,
    releaseYear: entry.releaseYear || getYear(match),
    chronologyIndex: entry.chronologyIndex,
    releaseIndex: entry.releaseIndex,
    importanceScore: entry.importanceScore,
    requirement,
    aiExplanation: `${entry.title} is ${requirement} because it ${entry.continuityRelevance}.`,
    emotionalRelevance: entry.emotionalContext,
    continuitySignificance: entry.continuityRelevance,
  };
};

export const TimelineBuilder = {
  buildCanonical: async (
    required: CanonicalEntry[],
    optional: CanonicalEntry[],
  ): Promise<RoadmapNode[]> => {
    const requiredNodes = await Promise.all(
      required.map((entry) => enrichCanonicalEntry(entry, "required")),
    );
    const optionalNodes = await Promise.all(
      optional.map((entry) => enrichCanonicalEntry(entry, "optional")),
    );

    return [...requiredNodes, ...optionalNodes];
  },

  build: async (blueprint: ContinuityBlueprint): Promise<RoadmapNode[]> => {
    const titles = [...blueprint.coreTitles, ...blueprint.optionalTitles];
    const nodes = await Promise.all(
      titles.map(async (title, index) => {
        const results = await TmdbService.searchMulti(title).catch(() => []);
        const match =
          results.find((item: any) => item.media_type === "movie" || item.media_type === "tv") ||
          {};
        const required = index < blueprint.coreTitles.length;

        return {
          id: `${match.id || title}-${index}`,
          title: match.title || match.name || title,
          mediaType: match.media_type === "tv" ? "tv" : "movie",
          posterPath: match.poster_path,
          releaseYear: getYear(match),
          importanceScore: required ? Math.max(76, 96 - index * 4) : Math.max(58, 74 - index),
          requirement: required ? "required" : "optional",
          aiExplanation: required
            ? `Establishes key continuity and character context before the target story.`
            : `Adds side-story texture without blocking the main emotional path.`,
          emotionalRelevance:
            blueprint.characterFocus[index % blueprint.characterFocus.length] || "context",
          continuitySignificance:
            blueprint.continuityThemes[index % blueprint.continuityThemes.length] ||
            "story continuity",
        } satisfies RoadmapNode;
      }),
    );

    return nodes;
  },

  applyMode: (nodes: RoadmapNode[], mode: RoadmapMode): RoadmapNode[] => {
    if (mode === "Essential Only") {
      return nodes.filter((node) => node.requirement === "required");
    }
    if (mode === "Release Order" || mode === "Chronological") {
      const field = mode === "Chronological" ? "chronologyIndex" : "releaseIndex";
      return [...nodes].sort(
        (a, b) =>
          Number(a[field] || a.releaseYear || 9999) -
          Number(b[field] || b.releaseYear || 9999),
      );
    }
    if (mode === "Character Journey" || mode === "Emotional Arc") {
      return [...nodes].sort((a, b) => b.importanceScore - a.importanceScore);
    }
    return nodes;
  },
};
