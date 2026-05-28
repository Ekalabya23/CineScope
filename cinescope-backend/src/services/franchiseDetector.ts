import { TmdbService } from "./tmdb.service";

export type FranchiseDetection = {
  requestedTitle: string;
  universe: string;
  mediaType: "movie" | "tv";
  detectedTitle: string;
  overview?: string;
  releaseYear?: string;
  tmdbId?: number;
  confidence: number;
  searchResults: any[];
};

const universePatterns: Array<[RegExp, string]> = [
  [/daredevil|avengers|marvel|spider-?man|loki|wanda|x-?men|deadpool|secret wars|moon knight|punisher|jessica jones|iron man|captain america|thor/i, "Marvel"],
  [/batman|superman|dc|justice league|joker|wonder woman|peacemaker|flash|aquaman|green lantern/i, "DC"],
  [/star wars|mandalorian|ahsoka|andor|obi-wan|skywalker|jedi|sith/i, "Star Wars"],
  [/naruto|boruto|one piece|dragon ball|bleach|attack on titan|jujutsu|demon slayer|anime/i, "Anime Universe"],
  [/harry potter|fantastic beasts|wizarding/i, "Wizarding World"],
  [/lord of the rings|hobbit|rings of power|middle earth/i, "Middle-earth"],
  [/fast and furious|hobbs|shaw/i, "Fast Saga"],
];

const getYear = (item: any) =>
  String(item.release_date || item.first_air_date || "").slice(0, 4) || undefined;

export const FranchiseDetector = {
  detect: async (title: string): Promise<FranchiseDetection> => {
    const searchResults = await TmdbService.searchMulti(title);
    const primary =
      searchResults.find((item: any) => item.media_type === "movie" || item.media_type === "tv") ||
      searchResults[0] ||
      {};
    const detectedTitle = primary.title || primary.name || title;
    const haystack = `${title} ${detectedTitle} ${primary.overview || ""}`;
    const universeMatch = universePatterns.find(([pattern]) => pattern.test(haystack));

    return {
      requestedTitle: title,
      universe: universeMatch?.[1] || "Standalone / Emerging Franchise",
      mediaType: primary.media_type === "tv" ? "tv" : "movie",
      detectedTitle,
      overview: primary.overview,
      releaseYear: getYear(primary),
      tmdbId: primary.id,
      confidence: universeMatch ? 92 : primary.id ? 74 : 58,
      searchResults: searchResults.slice(0, 8),
    };
  },
};
