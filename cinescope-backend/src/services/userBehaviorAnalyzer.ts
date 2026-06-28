import { AiInteraction } from "../models/aiInteraction.model";
import { RecommendationAnalytics } from "../models/recommendationAnalytics.model";
import { ReelInteraction } from "../models/reelInteraction.model";
import { UserHistory } from "../models/userHistory.model";
import { Watchlist } from "../models/watchlist.model";

const topValues = (values: string[], limit = 5) => {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (value) acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
};

export const UserBehaviorAnalyzer = {
  getBehaviorSnapshot: async (userId: string) => {
    const [history, watchlist, interactions, aiInteractions, reelInteractions] = await Promise.all([
      UserHistory.find({ userId }).sort({ lastViewedAt: -1 }).limit(80).lean(),
      Watchlist.find({ userId }).sort({ createdAt: -1 }).limit(80).lean(),
      RecommendationAnalytics.find({ userId }).sort({ createdAt: -1 }).limit(120).lean(),
      AiInteraction.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      ReelInteraction.find({ userId })
        .populate("reelId", "moodTags mediaType tmdbId title")
        .sort({ createdAt: -1 })
        .limit(120)
        .lean(),
    ]);

    return {
      history,
      watchlist,
      interactions,
      aiInteractions,
      reelInteractions,
      repeatedSearches: topValues(
        interactions
          .filter((item) => item.interactionType === "search")
          .map((item) => String(item.metadata?.query || "")),
      ),
      trailerClicks: interactions.filter((item) => item.interactionType === "trailer_click"),
      savedItems: interactions.filter((item) =>
        ["saved", "watchlist_add", "accepted"].includes(item.interactionType),
      ),
    };
  },

  summarizeWatchPattern: (history: any[]) => {
    const hours = history
      .map((entry) => new Date(entry.lastViewedAt || entry.updatedAt).getHours())
      .filter((hour) => !Number.isNaN(hour));
    const lateNight = hours.filter((hour) => hour >= 22 || hour <= 3).length;
    const evening = hours.filter((hour) => hour >= 18 && hour < 22).length;
    if (lateNight >= evening && lateNight > 0) return "Late Night";
    if (evening > 0) return "Evening Lean";
    return "Exploratory";
  },

  topValues,
};
