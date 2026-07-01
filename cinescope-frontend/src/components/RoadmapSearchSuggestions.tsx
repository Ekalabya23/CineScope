import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "../api/client";
import { imageUrl } from "../utils/media";

export type RoadmapSuggestion = {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: "movie" | "tv";
  rating: string;
  franchise: string;
};

type Props = {
  query: string;
  submittedQuery?: string;
  isGenerating?: boolean;
  onPick: (suggestion: RoadmapSuggestion) => void;
  className?: string;
};

const SkeletonCard = () => (
  <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl">
    <div className="flex gap-3">
      <div className="h-16 w-12 animate-pulse rounded-xl bg-white/10" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  </div>
);

export const RoadmapSearchSuggestions: React.FC<Props> = ({
  query,
  submittedQuery,
  isGenerating,
  onPick,
  className,
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "open" | "empty" | "error"
  >("idle");
  const [results, setResults] = useState<RoadmapSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const firstItemIdRef = useRef<string | null>(null);

  const normalizedQuery = query.trim();
  const normalizedSubmitted = submittedQuery?.trim().toLowerCase() || "";

  const canSearch = useMemo(
    () => normalizedQuery.length >= 2 && normalizedQuery.toLowerCase() !== normalizedSubmitted,
    [normalizedQuery, normalizedSubmitted],
  );

  useEffect(() => {
    if (!canSearch || isGenerating) {
      setIsOpen(false);
      setStatus("idle");
      setResults([]);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const t = window.setTimeout(() => {
      setStatus("loading");

      apiClient
        .get(`/search/suggestions?q=${encodeURIComponent(normalizedQuery)}`)
        .then((res) => {
          const next = (res.data?.results || []) as RoadmapSuggestion[];
          setResults(next);
          setActiveIndex(0);
          setStatus(next.length ? "open" : "empty");
          setIsOpen(true);
        })
        .catch((e) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setStatus("error");
          setIsOpen(true);
          // premium UX: silently fail without spamming console
          console.debug("Suggestion fetch failed", e?.message);
        });
    }, 260);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [apiClient, canSearch, normalizedQuery, isGenerating]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        if (results[activeIndex]) {
          e.preventDefault();
          onPick(results[activeIndex]);
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, isOpen, onPick, results]);

  const emptyCopy = useMemo(() => {
    if (status === "empty") return "No cinematic universes detected.";
    if (status === "loading") return "";
    if (status === "error") return "Cinematic search is unavailable right now.";
    return "";
  }, [status]);

  const cachePosters = useMemo(() => {
    // normalize backend poster into tmdb URL if needed
    return results.map((r) => ({
      ...r,
      poster:
        r.poster && r.poster.startsWith("http")
          ? r.poster
          : r.poster
            ? imageUrl(r.poster, "w300")
            : "",
    }));
  }, [results]);

  // remember first item id for focus scoping
  useEffect(() => {
    firstItemIdRef.current = cachePosters[0]?.id || null;
  }, [cachePosters]);

  return (
    <div className={className}>
      <AnimatePresence>
        {isOpen && canSearch && status !== "idle" && (
          <motion.div
            key={normalizedQuery}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="z-50 mt-2 max-h-[60vh] sm:max-h-[420px] overflow-y-auto rounded-[1.4rem] border border-white/15 bg-[#0c0d14]/[0.98] p-3 shadow-[0_12px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl sm:backdrop-blur-3xl"
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                Cinematic suggestions
              </p>
              {status === "loading" && (
                <p className="text-[11px] font-bold text-zinc-400">Scanning…</p>
              )}
            </div>

            {status === "loading" && (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {status !== "loading" && cachePosters.length === 0 && (
              <div className="relative grid min-h-[120px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center">
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-300/25 via-sky-300/20 to-violet-300/25 blur-2xl animate-pulse" />
                </div>
                <p className="relative text-sm font-black text-white">
                  {emptyCopy}
                </p>
                <div className="relative mt-2 text-[11px] font-semibold text-zinc-400">
                  Type a universe title to unlock the best path.
                </div>
              </div>
            )}

            <div ref={listRef} className="grid gap-3">
              {status !== "loading" &&
                cachePosters.map((s, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onPointerDown={() => {
                        onPick(s);
                        setIsOpen(false);
                      }}
                      onClick={() => {
                        onPick(s);
                        setIsOpen(false);
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition backdrop-blur-xl focus:outline-none ${
                        isActive
                          ? "border-white/25 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" />
                      <div className="relative h-16 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {s.poster ? (
                          <img
                            src={s.poster}
                            alt={s.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-white/10" />
                        )}
                        <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                          <div className="h-full w-full bg-gradient-to-r from-red-300/10 via-sky-300/10 to-violet-300/10 animate-pulse" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                              {s.type === "tv" ? "Series" : "Film"} ·{" "}
                              {s.year || "TBA"}
                            </p>
                            <p className="mt-1 truncate text-sm font-black text-white">
                              {s.title}
                            </p>
                          </div>
                          <div className="flex-none rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-black text-zinc-200">
                            ★ {s.rating ? Number(s.rating).toFixed(1) : "—"}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-zinc-300">
                            {s.franchise}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-red-400/20 px-2 py-1 text-[11px] font-black text-red-100">
                              Enter
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
            </div>

            <div className="pointer-events-none mt-3 px-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="mt-3 hidden sm:flex text-[11px] font-bold text-zinc-500">
                Use ↑/↓ to navigate · Enter to select · Esc to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
