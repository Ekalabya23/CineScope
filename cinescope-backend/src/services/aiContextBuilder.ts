import { Chat } from "../models/chat.model";
import { MoodAnalyzer } from "./moodAnalyzer";
import { TasteProfileService } from "./tasteProfileService";
import { UserBehaviorAnalyzer } from "./userBehaviorAnalyzer";

export const AiContextBuilder = {
  buildContext: async (userId: string, currentPrompt = "", currentMood?: string) => {
    const [tasteProfile, behavior, chatHistory] = await Promise.all([
      TasteProfileService.generateTasteProfile(userId),
      UserBehaviorAnalyzer.getBehaviorSnapshot(userId),
      Chat.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    const mood = currentMood || MoodAnalyzer.inferMoodFromText(currentPrompt);

    return {
      favoriteGenres: tasteProfile?.favoriteGenres || [],
      dominantMood: mood,
      dominantMoods: tasteProfile?.dominantMoods || [],
      preferredThemes: tasteProfile?.preferredThemes || [],
      watchPattern: tasteProfile?.watchPattern || "Exploratory",
      engagementScore: tasteProfile?.engagementScore || {},
      recentBehavior: tasteProfile?.behaviorSummary || "Fresh profile with limited signals.",
      savedMovies: behavior.watchlist.slice(0, 10).map((item: any) => item.title),
      recentHistory: behavior.history.slice(0, 10).map((item: any) => ({
        title: item.title,
        progressPercentage: item.progressPercentage,
        moods: item.moods,
      })),
      repeatedSearches: behavior.repeatedSearches,
      aiInteractionHistory: behavior.aiInteractions.slice(0, 5).map((item: any) => ({
        prompt: item.prompt,
        mood: item.mood,
      })),
      chatHistory: chatHistory.reverse(),
      currentPrompt,
    };
  },
};
