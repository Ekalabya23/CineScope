import { ContinuityBlueprint } from "./continuityAnalyzer";

export const EmotionalArcAnalyzer = {
  buildArc: (blueprint: ContinuityBlueprint, universe: string): string[] => {
    if (universe === "Marvel") {
      return [
        "Grounded Crime Drama",
        "Moral Pressure",
        "Psychological Collapse",
        "Power Re-entry",
        "Redemption & Identity Conflict",
      ];
    }

    if (universe === "Star Wars") {
      return ["Mythic Calling", "Loss & Exile", "Rebellion", "Legacy", "Hope Restored"];
    }

    return blueprint.characterFocus.map(
      (item) => item.charAt(0).toUpperCase() + item.slice(1),
    );
  },
};
