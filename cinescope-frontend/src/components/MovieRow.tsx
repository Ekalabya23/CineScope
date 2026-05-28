import React from "react";
import { MovieCard } from "./MovieCard";

interface MovieRowProps {
  title: string;
  movies: any[];
  type?: "movie" | "tv";
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  type = "movie",
}) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-3 py-4">
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 pl-1 border-l-4 border-red-600">
        {title}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} type={type} />
        ))}
      </div>
    </div>
  );
};
