import { AiInteraction } from "../models/aiInteraction.model";
import { RecommendationAnalytics } from "../models/recommendationAnalytics.model";
import { User } from "../models/user.model";
import { UserHistory } from "../models/userHistory.model";
import { Watchlist } from "../models/watchlist.model";
import { TasteProfileService } from "./tasteProfileService";
import { UserBehaviorAnalyzer } from "./userBehaviorAnalyzer";

const percentage = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const buildPersonalitySummary = (profile: any) => {
  if (
    !profile?.dominantMoods?.length &&
    !profile?.favoriteGenres?.length &&
    !profile?.preferredThemes?.length
  ) {
    return "CineScope is building your entertainment identity from real watch, save, and AI interaction signals.";
  }
  const mood = profile?.dominantMoods?.[0] || "adaptive";
  const genres = profile?.favoriteGenres?.slice(0, 2).join(" and ") || "cinematic";
  const themes = profile?.preferredThemes?.slice(0, 2).join(" with ") || "story-driven";
  return `You prefer ${mood.replace("-", " ")} ${genres} shaped by ${themes}.`;
};

const getEngagementScore = (profile: any, mood: string) => {
  const scoreMap = profile?.engagementScore;
  if (!scoreMap) return undefined;
  if (typeof scoreMap.get === "function") return scoreMap.get(mood);
  return scoreMap[mood];
};

export const UserProfileService = {
  getProfile: async (userId: string) => {
    const [user, tasteProfile, history, watchlist] = await Promise.all([
      User.findById(userId).lean(),
      TasteProfileService.generateTasteProfile(userId),
      UserHistory.find({ userId }).sort({ lastViewedAt: -1 }).limit(12).lean(),
      Watchlist.find({ userId }).sort({ createdAt: -1 }).limit(12).lean(),
    ]);

    return {
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        joinDate: user?.createdAt,
        avatarUrl: user?.avatarUrl,
        backdropUrl: user?.backdropUrl,
        bio: user?.bio,
        viewingPersonality:
          user?.viewingPersonality || buildPersonalitySummary(tasteProfile),
      },
      tasteProfile,
      recentHistory: history,
      watchlistPreview: watchlist,
      aiPersonalitySummary: buildPersonalitySummary(tasteProfile),
    };
  },

  updateProfile: async (
    userId: string,
    payload: {
      name?: string;
      avatarUrl?: string;
      backdropUrl?: string;
      bio?: string;
      viewingPersonality?: string;
    },
  ) => {
    const allowed = {
      name: payload.name,
      avatarUrl: payload.avatarUrl,
      backdropUrl: payload.backdropUrl,
      bio: payload.bio,
      viewingPersonality: payload.viewingPersonality,
    };

    Object.keys(allowed).forEach((key) => {
      if (allowed[key as keyof typeof allowed] === undefined) {
        delete allowed[key as keyof typeof allowed];
      }
    });

    return User.findByIdAndUpdate(userId, allowed, {
      new: true,
      runValidators: true,
    }).lean();
  },

  getHistory: async (userId: string) =>
    UserHistory.find({ userId }).sort({ lastViewedAt: -1 }).limit(100).lean(),

  getAnalytics: async (userId: string) => {
    const [tasteProfile, history, watchlist, analytics, aiInteractions] =
      await Promise.all([
        TasteProfileService.generateTasteProfile(userId),
        UserHistory.find({ userId }).sort({ lastViewedAt: -1 }).limit(200).lean(),
        Watchlist.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
        RecommendationAnalytics.find({ userId }).sort({ createdAt: -1 }).limit(300).lean(),
        AiInteraction.find({ userId }).sort({ createdAt: -1 }).limit(80).lean(),
      ]);

    const accepted = analytics.filter((item) =>
      ["accepted", "saved", "watchlist_add", "completed"].includes(item.interactionType),
    ).length;
    const ignored = analytics.filter((item) => item.interactionType === "ignored").length;
    const recommended = analytics.filter(
      (item) => item.interactionType === "recommended",
    ).length;
    const totalJudged = accepted + ignored;
    const genreSignals = [
      ...(tasteProfile?.favoriteGenres || []),
      ...history.flatMap((item: any) => item.genres || []),
    ];
    const moodSignals = [
      ...(tasteProfile?.dominantMoods || []),
      ...history.flatMap((item: any) => item.moods || []),
      ...analytics.map((item: any) => item.mood).filter(Boolean),
    ];

    return {
      totals: {
        watchHistory: history.length,
        watchlist: watchlist.length,
        aiInteractions: aiInteractions.length,
        recommendationEvents: analytics.length,
      },
      recommendationAcceptanceRate: percentage(
        accepted,
        totalJudged || recommended || analytics.length,
      ),
      aiMatchAccuracy:
        accepted + ignored > 0 ? percentage(accepted, accepted + ignored) : null,
      genresExplored: UserBehaviorAnalyzer.topValues(genreSignals, 8),
      moodPreferences: UserBehaviorAnalyzer.topValues(moodSignals, 8).map((mood, index) => ({
        mood,
        score: getEngagementScore(tasteProfile, mood) || Math.max(48, 92 - index * 8),
      })),
      themePreferences: tasteProfile?.preferredThemes || [],
      viewingPattern: tasteProfile?.watchPattern || "Exploratory",
      aiPersonalitySummary: buildPersonalitySummary(tasteProfile),
    };
  },
};
