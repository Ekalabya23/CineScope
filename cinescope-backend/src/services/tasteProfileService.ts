import { TasteProfile } from "../models/tasteProfile.model";
import { UserBehaviorAnalyzer } from "./userBehaviorAnalyzer";

export const TasteProfileService = {
  generateTasteProfile: async (userId: string) => {
    const snapshot = await UserBehaviorAnalyzer.getBehaviorSnapshot(userId);
    const genreSignals = snapshot.history.flatMap((item: any) => item.genres || []);
    const moodSignals = [
      ...snapshot.history.flatMap((item: any) => item.moods || []),
      ...snapshot.interactions.map((item: any) => item.mood).filter(Boolean),
      ...snapshot.aiInteractions.map((item: any) => item.mood).filter(Boolean),
      ...snapshot.reelInteractions
        .filter((item: any) => ["watched_full", "tapped_through", "saved"].includes(item.action))
        .flatMap((item: any) => item.reelId?.moodTags || []),
    ];
    const themeSignals = [
      ...snapshot.history.flatMap((item: any) => item.themes || []),
      ...snapshot.aiInteractions.flatMap((item: any) =>
        item.enrichedContext?.preferredThemes || [],
      ),
    ];
    const hasBehaviorSignals =
      snapshot.history.length > 0 ||
      snapshot.watchlist.length > 0 ||
      snapshot.interactions.length > 0 ||
      snapshot.aiInteractions.length > 0 ||
      snapshot.reelInteractions.length > 0;

    const dominantMoods =
      UserBehaviorAnalyzer.topValues(moodSignals, 4).length > 0
        ? UserBehaviorAnalyzer.topValues(moodSignals, 4)
        : [];

    const engagementScore = dominantMoods.reduce<Record<string, number>>((acc, mood, index) => {
      acc[mood] = Math.max(72, 96 - index * 7);
      return acc;
    }, {});

    const profile = {
      favoriteGenres: UserBehaviorAnalyzer.topValues(genreSignals, 5),
      dominantMoods,
      preferredThemes: UserBehaviorAnalyzer.topValues(themeSignals, 5),
      preferredRuntimes: { min: 85, max: 145, label: "Feature-length cinematic" },
      watchPattern: UserBehaviorAnalyzer.summarizeWatchPattern(snapshot.history),
      engagementScore,
      behaviorSummary:
        !hasBehaviorSignals
          ? "CineScope is still learning from your searches, saves, and watch progress."
          : dominantMoods[0] === "dark"
          ? "Late-session psychological and darker-toned discovery behavior."
          : "Concept-driven cinematic discovery with strong mood clustering.",
      lastAnalyzedAt: new Date(),
    };

    return TasteProfile.findOneAndUpdate({ userId }, profile, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();
  },
};
