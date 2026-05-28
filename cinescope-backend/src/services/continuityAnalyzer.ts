import { FranchiseDetection } from "./franchiseDetector";

export type ContinuityBlueprint = {
  coreTitles: string[];
  optionalTitles: string[];
  characterFocus: string[];
  continuityThemes: string[];
};

const blueprints: Record<string, ContinuityBlueprint> = {
  Marvel: {
    coreTitles: [
      "Daredevil",
      "The Defenders",
      "Daredevil Season 3",
      "Spider-Man: No Way Home",
      "Echo",
    ],
    optionalTitles: ["Jessica Jones", "The Punisher", "Hawkeye", "She-Hulk: Attorney at Law"],
    characterFocus: ["identity", "street-level justice", "trauma", "redemption"],
    continuityThemes: ["grounded crime drama", "legal morality", "Kingpin power shift"],
  },
  DC: {
    coreTitles: ["Man of Steel", "Batman v Superman: Dawn of Justice", "Wonder Woman", "Justice League"],
    optionalTitles: ["The Batman", "Peacemaker", "The Flash"],
    characterFocus: ["legacy", "power", "public myth", "moral conflict"],
    continuityThemes: ["heroic identity", "timeline pressure", "world-scale stakes"],
  },
  "Star Wars": {
    coreTitles: ["Star Wars: Episode IV - A New Hope", "Star Wars: Episode V - The Empire Strikes Back", "Star Wars: Episode VI - Return of the Jedi"],
    optionalTitles: ["The Mandalorian", "Ahsoka", "Andor", "Obi-Wan Kenobi"],
    characterFocus: ["legacy", "rebellion", "faith", "chosen family"],
    continuityThemes: ["Force mythology", "empire resistance", "character lineage"],
  },
  "Anime Universe": {
    coreTitles: ["Origin Arc", "Training Arc", "Main Conflict Arc", "Final Battle Arc"],
    optionalTitles: ["OVA Side Story", "Movie Special", "Spin-off Arc"],
    characterFocus: ["growth", "rivalry", "loss", "resolve"],
    continuityThemes: ["power escalation", "emotional bonds", "identity arc"],
  },
};

export const ContinuityAnalyzer = {
  analyze: (detection: FranchiseDetection): ContinuityBlueprint => {
    const base = blueprints[detection.universe] || {
      coreTitles: detection.searchResults
        .map((item: any) => item.title || item.name)
        .filter(Boolean)
        .slice(0, 4),
      optionalTitles: [],
      characterFocus: ["context", "tone", "character motivation"],
      continuityThemes: ["story context", "emotional setup", "world rules"],
    };

    if (!base.coreTitles.includes(detection.detectedTitle)) {
      return {
        ...base,
        coreTitles: [...base.coreTitles.slice(0, 5), detection.detectedTitle],
      };
    }

    return base;
  },
};
