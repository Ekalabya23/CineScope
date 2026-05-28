import { MoodAnalyzer } from "./moodAnalyzer";
import { TmdbService } from "./tmdb.service";
import { RecommendationScorer } from "./recommendationScorer";
import { formatMediaItems } from "../utils/mediaFormatter";

export const DiscoveryService = {
  discoverByMood: async (moodInput: string, profile: any = {}, page = 1) => {
    const moodProfile = MoodAnalyzer.getMoodProfile(moodInput);
    const items = await TmdbService.discoverMedia("movie", {
      with_genres: moodProfile.genres,
      with_keywords: moodProfile.keywords,
      sort_by: moodProfile.sorting,
      "vote_count.gte": 250,
      include_adult: false,
      page,
    });

    return {
      mood: moodProfile.mood,
      emotionalTone: moodProfile.emotionalTone,
      visualTheme: moodProfile.visualTheme,
      themes: moodProfile.themes,
      layout: moodProfile.mood === "adrenaline" ? "cinematic-banner" : "poster-row",
      items: formatMediaItems(items.slice(0, 20), (item) =>
        RecommendationScorer.scoreItem(item, profile, {
          mood: moodProfile.mood,
          emotionalTone: moodProfile.emotionalTone,
          theme: moodProfile.themes[0],
          themes: moodProfile.themes,
          recommendationReason: `Selected for ${moodProfile.emotionalTone} and ${moodProfile.themes.join(", ")} signals.`,
        }),
      ),
    };
  },
};
