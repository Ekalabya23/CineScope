export const imageUrl = (
  path?: string,
  size: "w300" | "w500" | "w780" | "w1280" | "original" = "w500",
) =>
  path
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200";

export const getTitle = (item: any) =>
  item?.title || item?.name || item?.originalTitle || item?.original_name || "Untitled";

export const getMediaType = (item: any, fallback: "movie" | "tv" = "movie") =>
  item?.mediaType || item?.media_type || (item?.first_air_date ? "tv" : fallback);

export const getPosterPath = (item: any) => item?.posterPath || item?.poster_path;

export const getBackdropPath = (item: any) =>
  item?.backdropPath || item?.backdrop_path || getPosterPath(item);

export const getRating = (item: any) => {
  const value = item?.voteAverage ?? item?.vote_average;
  return typeof value === "number" ? value.toFixed(1) : "N/A";
};

export const getReleaseYear = (item: any) => {
  const raw = item?.releaseDate || item?.release_date || item?.first_air_date;
  return raw ? new Date(raw).getFullYear() : null;
};

export const getRecommendation = (item: any) => item?.recommendation || {};

export const getMatch = (item: any) => {
  const score = getRecommendation(item)?.matchPercentage;
  if (typeof score === "number") return Math.min(99, Math.max(1, score));
  return null;
};

export const normalizeGenres = (item: any) => {
  if (Array.isArray(item?.genres)) {
    return item.genres.map((genre: any) =>
      typeof genre === "string" ? genre : genre?.name,
    ).filter(Boolean);
  }
  return [];
};
