import { TmdbService } from "./tmdb.service";
import { CriticAnalysisEngine } from "./criticAnalysisEngine";
import { SentimentAnalyzer } from "./sentimentAnalyzer";
import { VibeTagGenerator } from "./vibeTagGenerator";
import { YouTubeReviewService } from "./youtubeReviewService";

export const CreatorInsightService = {
  buildForMedia: async (id: string, type: "movie" | "tv" = "movie") => {
    const media = (
      type === "tv"
        ? await TmdbService.getTvDetails(id)
        : await TmdbService.getMovieDetails(id)
    ) as any;
    const title = media.title || media.name || "Untitled";
    const reviewSignals = await YouTubeReviewService.searchCreatorReviews(title, type);
    const textSignals = reviewSignals.flatMap((signal) => [
      signal.videoTitle,
      signal.description,
    ]);
    const vibes = VibeTagGenerator.generate(media, textSignals);
    const scores = SentimentAnalyzer.score(media, vibes);

    return CriticAnalysisEngine.analyze(media, reviewSignals, vibes, scores);
  },
};
