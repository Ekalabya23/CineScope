import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { MovieCard } from "../components/MovieCard";
import {
  CreatorInsights,
  CreatorInsightsPanel,
} from "../components/CreatorInsightsPanel";
import { platformApi } from "../services/platformApi";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMoodTheme } from "../theme/cinematicTheme";
import {
  getBackdropPath,
  getRating,
  getTitle,
  imageUrl,
} from "../utils/media";

export const MediaDetails: React.FC = () => {
  const { type = "movie", id = "" } = useParams();
  const [media, setMedia] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [creatorInsights, setCreatorInsights] = useState<CreatorInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { setCinematicMood } = useCinematicTheme();

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setInsightsLoading(true);
      try {
        const [detailsRes, similarData, creatorData] = await Promise.all([
          apiClient.get(`/movies/details/${id}?type=${type}`),
          platformApi.similar(id, type).catch(() => null),
          apiClient
            .get(`/movies/${id}/creator-insights?type=${type}`)
            .then((res) => res.data.data)
            .catch(() => null),
        ]);
        if (!mounted) return;
        setMedia(detailsRes.data.data);
        setSimilar(similarData?.items || []);
        setCreatorInsights(creatorData);
        const primaryMood = similarData?.items?.[0]?.recommendation?.moodAlignment || "mind-bending";
        setCinematicMood(primaryMood, detailsRes.data.data?.backdrop_path);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
          setInsightsLoading(false);
        }
      }
    };
    fetchDetails();
    return () => {
      mounted = false;
    };
  }, [id, type, setCinematicMood]);

  const trailerVideo = useMemo(
    () =>
      media?.videos?.results?.find(
        (video: any) => video.site === "YouTube" && video.type === "Trailer",
      ),
    [media],
  );
  const theme = getMoodTheme(similar[0]?.recommendation?.moodAlignment);

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-[#050609] text-xs font-bold uppercase tracking-[0.28em] text-zinc-500">
        Syncing cinematic intelligence
      </div>
    );
  }

  if (!media) {
    return (
      <div className="grid h-screen place-items-center bg-[#050609] text-zinc-400">
        Unable to load this title.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050609] pb-24 text-white">
      <section className="relative min-h-[78vh] overflow-hidden">
        <img
          src={imageUrl(getBackdropPath(media), "original")}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050609] via-[#050609]/45 to-transparent" />
        <div className="absolute inset-0" style={{ background: theme.gradient }} />

        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end gap-8 px-5 pb-14 pt-32 md:px-12 lg:flex-row lg:items-end">
          <motion.img
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            src={imageUrl(media.poster_path, "w500")}
            alt={getTitle(media)}
            className="w-52 rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl md:w-64"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl space-y-5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
              Cinematic detail system
            </p>
            <h1 className="text-5xl font-black leading-none text-white md:text-7xl">
              {getTitle(media)}
            </h1>
            {media.tagline && <p className="text-lg italic text-zinc-300">{media.tagline}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-black text-yellow-200">
                ★ {getRating(media)}
              </span>
              {media.runtime && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-200">
                  {media.runtime}m
                </span>
              )}
              {media.genres?.map((genre: any) => (
                <span key={genre.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                  {genre.name}
                </span>
              ))}
            </div>
            <p className="max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
              {media.overview}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Mood analysis", similar[0]?.recommendation?.moodAlignment || "cinematic"],
                [
                  "AI confidence",
                  similar[0]?.recommendation?.confidence
                    ? `${similar[0].recommendation.confidence}%`
                    : "Learning",
                ],
                [
                  "Emotional fit",
                  similar[0]?.recommendation?.emotionalAlignment
                    ? `${similar[0].recommendation.emotionalAlignment}%`
                    : "Learning",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
                  <p className="mt-1 text-lg font-black capitalize text-white">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="space-y-16">
        <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[linear-gradient(180deg,#050609,rgba(9,10,15,0.96)_45%,#050609)] px-4 py-12 md:px-10 lg:px-16">
          <div className="mx-auto max-w-[1700px]">
            <CreatorInsightsPanel
              insights={creatorInsights}
              loading={insightsLoading}
              accent={theme.accent}
            />
          </div>
        </section>

        <div className="mx-auto max-w-[1700px] space-y-16 px-5 md:px-12 lg:px-16">
        {trailerVideo && (
          <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
            <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.key}?rel=0`}
                title="Trailer"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: theme.accent }}>
                AI explanation
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Why this universe works</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Similar titles are scored by genre affinity, mood alignment, emotional tone,
                engagement probability, and cinematic quality signals from your taste profile.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Streaming providers", "Cast signals", "Similar universes", "Emotional themes"].map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {media.credits?.cast?.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-3xl font-black text-white">Cast</h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {media.credits.cast.slice(0, 14).map((person: any) => (
                <div key={person.cast_id || person.id} className="w-32 flex-none rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                  <img
                    src={imageUrl(person.profile_path, "w300")}
                    alt={person.name}
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <h3 className="mt-2 truncate text-xs font-black text-white">{person.name}</h3>
                  <p className="truncate text-[10px] text-zinc-500">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: theme.accent }}>
                Similar universes
              </p>
              <h2 className="mt-1 text-3xl font-black text-white">AI-Matched Next Watches</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-5 scrollbar-hide">
              {similar.map((item) => (
                <MovieCard key={item.id} movie={item} type={type as "movie" | "tv"} mood={item.recommendation?.moodAlignment} />
              ))}
            </div>
          </section>
        )}
        </div>
      </div>
    </main>
  );
};
