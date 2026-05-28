import { TmdbService } from "./tmdb.service";
import { formatMediaItem } from "../utils/mediaFormatter";

const hasTrailer = (details: any) =>
  Array.isArray(details?.videos?.results) &&
  details.videos.results.some(
    (video: any) => video.site === "YouTube" && video.type === "Trailer",
  );

export const HeroSelector = {
  selectHero: async (candidatePool: any[]) => {
    const candidates = candidatePool
      .filter((item) => item.backdropPath || item.backdrop_path)
      .sort((a, b) => {
        const left =
          (a.voteCount || a.vote_count || 0) * 0.25 +
          (a.popularity || 0) * 1.2 +
          (a.voteAverage || a.vote_average || 0) * 70;
        const right =
          (b.voteCount || b.vote_count || 0) * 0.25 +
          (b.popularity || 0) * 1.2 +
          (b.voteAverage || b.vote_average || 0) * 70;
        return right - left;
      })
      .slice(0, 6);

    const detailed = await Promise.allSettled(
      candidates.map((item) =>
        (item.mediaType || item.media_type) === "tv"
          ? TmdbService.getTvDetails(item.id)
          : TmdbService.getMovieDetails(item.id),
      ),
    );

    const scored = candidates.map((item, index) => {
      const details: any =
        detailed[index].status === "fulfilled" ? detailed[index].value : {};
      const trailerBoost = hasTrailer(details) ? 12 : 0;
      const cinematicScore = Math.min(
        100,
        Math.round(
          (item.voteAverage || item.vote_average || 0) * 7 +
            Math.min(25, (item.voteCount || item.vote_count || 0) / 400) +
            Math.min(25, (item.popularity || 0) / 20) +
            trailerBoost,
        ),
      );

      return {
        item: {
          ...item,
          ...(details || {}),
          media_type: item.mediaType || item.media_type,
        },
        cinematicScore,
        hasTrailer: hasTrailer(details),
      };
    });

    const hero = scored.sort((a, b) => b.cinematicScore - a.cinematicScore)[0];
    if (!hero) return null;

    return {
      ...formatMediaItem(hero.item, {
        matchPercentage: hero.cinematicScore,
        confidence: hero.hasTrailer ? 94 : 86,
        emotionalAlignment: hero.cinematicScore,
        moodAlignment: "cinematic-impact",
        similarityScore: hero.cinematicScore,
        emotionalTags: ["cinematic", "high-impact", "premium-hero"],
        recommendationReason:
          "Selected for strong backdrop presence, popularity, quality, and trailer readiness.",
      }),
      heroMetadata: {
        cinematicScore: hero.cinematicScore,
        backdropQuality: hero.item.backdrop_path ? "high" : "unknown",
        trailerAvailable: hero.hasTrailer,
        selectionModel: "hero-cinematic-v1",
      },
    };
  },
};
