import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMoodTheme } from "../theme/cinematicTheme";
import {
  getBackdropPath,
  getMatch,
  getMediaType,
  getRating,
  getRecommendation,
  getTitle,
  imageUrl,
  normalizeGenres,
} from "../utils/media";

export const CinematicHero: React.FC<{ hero: any; fallbackItems?: any[] }> = ({
  hero,
  fallbackItems = [],
}) => {
  const navigate = useNavigate();
  const { setCinematicMood } = useCinematicTheme();
  const slides = useMemo(
    () => [hero, ...fallbackItems.filter((item) => item?.id !== hero?.id)].filter(Boolean).slice(0, 5),
    [hero, fallbackItems],
  );
  const [index, setIndex] = useState(0);
  const [explainOpen, setExplainOpen] = useState(false);
  const active = slides[index] || hero;
  const recommendation = getRecommendation(active);
  const match = getMatch(active);
  const mood = recommendation.moodAlignment || active?.mood || "mind-bending";
  const theme = getMoodTheme(mood);
  const mediaType = getMediaType(active);

  useEffect(() => {
    if (!slides.length) return;
    const interval = window.setInterval(
      () => setIndex((value) => (value + 1) % slides.length),
      8500,
    );
    return () => window.clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    setCinematicMood(mood, getBackdropPath(active));
  }, [active?.id, mood, setCinematicMood]);

  if (!active) return null;

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.img
          key={active.id}
          src={imageUrl(getBackdropPath(active), "original")}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.55, scale: 1.16 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050609] via-[#050609]/38 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050609] via-[#050609]/40 to-transparent" />
      <div className="absolute inset-0 opacity-80" style={{ background: theme.gradient }} />

      <div className="relative z-10 flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-24 pt-32 md:px-12 lg:px-16">
        <motion.div
          key={`${active.id}-copy`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-3xl space-y-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur"
              style={{ borderColor: theme.border, color: theme.accent }}
            >
              AI cinematic pick
            </span>
            {match !== null && (
              <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur">
                {match}% Match
              </span>
            )}
            <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-yellow-300 backdrop-blur">
              ★ {getRating(active)}
            </span>
          </div>

          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-normal text-white md:text-8xl">
            {getTitle(active)}
          </h1>

          <div className="flex flex-wrap gap-2">
            {(recommendation.emotionalTags || normalizeGenres(active)).slice(0, 4).map((tag: string) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-100 backdrop-blur">
                {tag}
              </span>
            ))}
          </div>

          <p className="max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
            {active.overview}
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-200 backdrop-blur-xl md:max-w-2xl">
            <span className="font-black" style={{ color: theme.accent }}>
              AI Insight:
            </span>{" "}
            {recommendation.recommendationReason ||
              active?.heroMetadata?.selectionModel ||
              "Chosen for cinematic visual impact, audience momentum, and mood alignment."}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/media/${mediaType}/${active.id}`)}
              className="rounded-xl bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-black shadow-xl transition hover:scale-[1.02]"
            >
              View Details
            </button>
            <button className="rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/15">
              Add to Watchlist
            </button>
            <button
              onClick={() => setExplainOpen(true)}
              className="rounded-xl border px-6 py-3 text-xs font-bold uppercase tracking-wider backdrop-blur transition hover:bg-white/10"
              style={{ borderColor: theme.border, color: theme.accent }}
            >
              AI Explanation
            </button>
          </div>
        </motion.div>

        <div className="absolute bottom-10 right-5 z-20 flex gap-2 md:right-12">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              onClick={() => setIndex(slideIndex)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: slideIndex === index ? 34 : 9,
                background: slideIndex === index ? theme.accent : "rgba(255,255,255,.34)",
              }}
              aria-label={`Show ${getTitle(slide)}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {explainOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-5 backdrop-blur"
            onClick={() => setExplainOpen(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              className="max-w-lg rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
                Recommendation logic
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">{getTitle(active)}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                {recommendation.recommendationReason ||
                  "This title scored highly across backdrop quality, audience popularity, emotional tone, and behavioral similarity."}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Match", match !== null ? `${match}%` : "Learning"],
                  ["Confidence", recommendation.confidence ? `${recommendation.confidence}%` : "Learning"],
                  ["Mood", mood],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase text-zinc-500">{label}</p>
                    <p className="mt-1 text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
