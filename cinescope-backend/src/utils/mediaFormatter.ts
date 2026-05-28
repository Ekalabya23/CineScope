import { genreNamesById } from "../config/recommendation.config";

export interface MediaRecommendationMetadata {
  matchPercentage: number;
  confidence: number;
  emotionalAlignment: number;
  moodAlignment: string;
  similarityScore: number;
  emotionalTags: string[];
  recommendationReason: string;
  streamingProviders?: any[];
}

export const formatMediaItem = (
  item: any,
  metadata?: Partial<MediaRecommendationMetadata>,
) => {
  const genreIds: number[] = Array.isArray(item.genre_ids)
    ? item.genre_ids
    : Array.isArray(item.genres)
      ? item.genres.map((genre: any) => genre.id).filter(Boolean)
      : [];

  return {
    id: item.id,
    mediaType: item.media_type || (item.first_air_date ? "tv" : "movie"),
    title: item.title || item.name,
    originalTitle: item.original_title || item.original_name,
    overview: item.overview,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    releaseDate: item.release_date || item.first_air_date,
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    genres: genreIds.map((id) => genreNamesById[id]).filter(Boolean),
    genreIds,
    recommendation: metadata,
  };
};

export const formatMediaItems = (
  items: any[],
  metadataFactory?: (item: any, index: number) => Partial<MediaRecommendationMetadata>,
) => items.map((item, index) => formatMediaItem(item, metadataFactory?.(item, index)));
