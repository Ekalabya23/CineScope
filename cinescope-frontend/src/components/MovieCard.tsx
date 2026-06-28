import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { getMoodTheme } from "../theme/cinematicTheme";
import {
  getBackdropPath,
  getMatch,
  getMediaType,
  getPosterPath,
  getRating,
  getRecommendation,
  getReleaseYear,
  getTitle,
  imageUrl,
  normalizeGenres,
} from "../utils/media";

interface MovieCardProps {
  movie: any;
  type?: "movie" | "tv";
  fluid?: boolean;
  size?: "poster" | "wide" | "feature" | "compact";
  mood?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  type = "movie",
  fluid = false,
  size = "poster",
  mood,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  const mediaType = getMediaType(movie, type);
  const title = getTitle(movie);
  const recommendation = getRecommendation(movie);
  const theme = getMoodTheme(mood || recommendation.moodAlignment);
  const match = getMatch(movie);
  const genres = normalizeGenres(movie).length
    ? normalizeGenres(movie)
    : details?.genres?.map((genre: any) => genre.name) || [];
  const releaseYear = getReleaseYear(movie);

  const trackRecommendationInteraction = (
    interactionType:
      | "accepted"
      | "hover"
      | "trailer_click"
      | "detail_click",
  ) => {
    apiClient
      .post("/history/interaction", {
        mediaId: movie.id,
        mediaType,
        title,
        interactionType,
        mood: mood || recommendation.moodAlignment,
        score: recommendation.matchPercentage,
        metadata: {
          genreIds: movie.genreIds || movie.genre_ids,
          genres,
          recommendation,
        },
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (isHovered && !details) {
      apiClient
        .get(`/movies/details/${movie.id}?type=${mediaType}`)
        .then((res) => setDetails(res.data.data))
        .catch(() => {});
    }
  }, [isHovered, movie.id, mediaType, details]);

  useEffect(() => {
    if (!isHovered) return;
    const timer = window.setTimeout(() => {
      trackRecommendationInteraction("hover");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isHovered]);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await apiClient.delete(`/watchlist/${movie.id}`);
      } else {
        await apiClient.post("/watchlist", {
          mediaId: movie.id,
          title,
          posterPath: getPosterPath(movie),
          mediaType,
          metadata: {
            mood: mood || recommendation.moodAlignment,
            genres,
            genreIds: movie.genreIds || movie.genre_ids,
          },
        });
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetails = () => {
    trackRecommendationInteraction("detail_click");
    navigate(`/media/${mediaType}/${movie.id}`);
  };
  const isWide = size === "wide" || size === "feature";
  const cardSize = fluid
    ? "w-full min-w-0"
    : isWide
      ? "w-[280px] sm:w-[360px]"
      : size === "compact"
        ? "w-32 sm:w-36"
        : "w-40 sm:w-44 md:w-48";

  return (
    <motion.article
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={openDetails}
      whileHover={{ y: -10, scale: 1.045, zIndex: 30 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`group relative ${cardSize} ${fluid ? "" : "flex-none"} cursor-pointer overflow-hidden rounded-xl border bg-zinc-950 shadow-2xl`}
      style={{
        borderColor: isHovered ? theme.border : "rgba(255,255,255,.07)",
        boxShadow: isHovered
          ? `0 24px 70px rgba(0,0,0,.65), 0 0 35px ${theme.glow}`
          : "0 18px 45px rgba(0,0,0,.35)",
      }}
    >
      <div className={isWide ? "aspect-[16/9]" : "aspect-[2/3]"}>
        <img
          src={imageUrl(
            isWide ? getBackdropPath(movie) : getPosterPath(movie),
            isWide ? "w780" : "w500",
          )}
          alt={title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:opacity-50"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: theme.gradient }}
      />

      <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
        {match !== null && (
          <span className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-emerald-300 backdrop-blur">
            {match}% Match
          </span>
        )}
        <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-yellow-300 backdrop-blur">
          ★ {getRating(movie)}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h4 className="line-clamp-2 text-sm font-black leading-tight text-white md:text-base">
          {title}
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-zinc-300">
          {releaseYear && <span>{releaseYear}</span>}
          <span className="rounded bg-white/10 px-1.5 py-0.5 uppercase">{mediaType}</span>
          {genres[0] && <span className="truncate">{genres[0]}</span>}
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-16"
          >
            <p className="line-clamp-3 text-[11px] leading-relaxed text-zinc-300">
              {movie.overview || details?.overview || recommendation.recommendationReason}
            </p>
            <div className="flex flex-wrap gap-1">
              {(recommendation.emotionalTags || genres).slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{ borderColor: theme.border, color: theme.accent }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="line-clamp-2 text-[10px] text-zinc-400">
              {recommendation.recommendationReason ||
                "Curated from live title metadata and collection context."}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetails();
                }}
                className="h-8 flex-1 rounded-lg bg-white text-[10px] font-black uppercase tracking-wide text-black"
              >
                Details
              </button>
              <button
                onClick={handleWatchlistToggle}
                className="h-8 rounded-lg border border-white/10 bg-white/10 px-3 text-[10px] font-bold text-white"
              >
                {isSaved ? "Saved" : "+"}
              </button>
              {details?.videos?.results?.[0]?.key && (
                <a
                  href={`https://www.youtube.com/watch?v=${details.videos.results[0].key}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackRecommendationInteraction("trailer_click");
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-[10px] font-bold text-white"
                >
                  ▶
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
