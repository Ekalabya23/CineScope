import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "../api/client";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMatch, getMediaType, getPosterPath, getRecommendation, getTitle, imageUrl } from "../utils/media";

const moodPrompts = [
  "Mind-bending sci-fi with emotional stakes",
  "Cozy films for a quiet night",
  "Dark psychological thrillers",
  "Cyberpunk worlds with neon atmosphere",
];

export const AiChatSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { theme } = useCinematicTheme();

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-cinescope-ai", open);
    return () => window.removeEventListener("open-cinescope-ai", open);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen) return;
    apiClient
      .get("/watchlist")
      .then((res) => setWatchlistIds(res.data.data.map((item: any) => item.mediaId)))
      .catch(() => {});
  }, [isOpen]);

  const runPrompt = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setLoading(true);

    try {
      const response = await apiClient.post("/ai/recommend", { prompt });
      const data = response.data.data;
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.explanation,
          context: data.context,
          results: data.results || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I could not reach the recommendation engine. Try a simpler mood.",
          results: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPrompt(input);
  };

  const toggleWatchlist = async (movie: any) => {
    const mediaType = getMediaType(movie);
    const isSaved = watchlistIds.includes(movie.id);
    try {
      if (isSaved) {
        await apiClient.delete(`/watchlist/${movie.id}`);
        setWatchlistIds((prev) => prev.filter((id) => id !== movie.id));
      } else {
        await apiClient.post("/watchlist", {
          mediaId: movie.id,
          title: getTitle(movie),
          posterPath: getPosterPath(movie),
          mediaType,
        });
        setWatchlistIds((prev) => [...prev, movie.id]);
      }
    } catch (err) {
      console.error("Watchlist update failed", err);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-7 right-7 z-40 hidden h-20 w-20 rounded-full border border-white/15 text-white shadow-2xl backdrop-blur-2xl md:grid md:place-items-center"
        animate={{
          boxShadow: [
            `0 0 26px ${theme.glow}`,
            `0 0 54px ${theme.glow}`,
            `0 0 26px ${theme.glow}`,
          ],
          rotate: [0, 2, -2, 0],
        }}
        whileHover={{ scale: 1.1, rotate: 0 }}
        whileTap={{ scale: 0.96 }}
        transition={{
          boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          background: `radial-gradient(circle at 34% 24%, rgba(255,255,255,.78), ${theme.accent} 18%, rgba(0,0,0,.78) 62%), ${theme.gradient}`,
        }}
        aria-label="Open CineScope AI"
      >
        <span
          className="absolute -inset-3 rounded-full border border-white/10 opacity-70"
          style={{ boxShadow: `inset 0 0 24px ${theme.glow}` }}
        />
        <span
          className="absolute inset-1 rounded-full opacity-60 blur-sm"
          style={{ background: theme.gradient }}
        />
        <motion.span
          className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-black text-[9px] font-black"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ color: theme.accent }}
        >
          AI
        </motion.span>
        <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-black/45 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20 transition group-hover:bg-white group-hover:text-black">
          Ask
        </span>
        <span className="pointer-events-none absolute right-[84px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/10 bg-black/70 px-4 py-2 text-xs font-black uppercase tracking-wider text-white opacity-0 backdrop-blur-xl transition group-hover:opacity-100 xl:block">
          CineScope AI
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "105%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "105%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 220 }}
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-zinc-950/82 shadow-2xl backdrop-blur-2xl"
          >
            <div
              className="border-b border-white/10 p-5"
              style={{ background: theme.gradient }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
                    Conversational discovery
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">CineScope AI</h3>
                  <p className="mt-1 text-xs text-zinc-300">
                    Concise mood-aware recommendations with behavioral context.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/15"
                  aria-label="Close AI assistant"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {moodPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => runPrompt(prompt)}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-28 scrollbar-hide">
              {messages.length === 0 && (
                <div className="grid h-full place-items-center text-center">
                  <div className="max-w-xs space-y-3">
                    <div
                      className="mx-auto h-16 w-16 rounded-full border"
                      style={{ borderColor: theme.border, boxShadow: `0 0 36px ${theme.glow}` }}
                    />
                    <h4 className="text-lg font-black text-white">Ask for a feeling, not a title.</h4>
                    <p className="text-sm leading-6 text-zinc-400">
                      Try a mood, a memory, a genre blend, or the kind of night you want.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className="space-y-3">
                  {msg.sender === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[82%] rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-sm leading-6 text-zinc-200 line-clamp-3">
                          {msg.text || "Here are the strongest matches."}
                        </p>
                        {msg.context?.dominantMood && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {[msg.context.dominantMood, ...(msg.context.preferredThemes || [])]
                              .slice(0, 4)
                              .map((tag: string) => (
                                <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-zinc-300">
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      {msg.results?.map((movie: any, resultIndex: number) => {
                        const recommendation = getRecommendation(movie);
                        const match = getMatch(movie);
                        return (
                          <motion.article
                            key={`${movie.id}-${resultIndex}`}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: resultIndex * 0.06 }}
                            className="relative flex gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                          >
                            <img
                              src={imageUrl(getPosterPath(movie), "w300")}
                              alt={getTitle(movie)}
                              className="h-32 w-20 flex-none rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="line-clamp-2 text-sm font-black text-white">
                                  {getTitle(movie)}
                                </h5>
                                {match !== null && (
                                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-300">
                                    {match}%
                                  </span>
                                )}
                              </div>
                              <p className="line-clamp-2 text-[11px] leading-5 text-zinc-400">
                                {recommendation.recommendationReason || movie.overview}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(recommendation.emotionalTags || []).slice(0, 3).map((tag: string) => (
                                  <span key={tag} className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] text-zinc-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => toggleWatchlist(movie)}
                                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                              >
                                {watchlistIds.includes(movie.id) ? "Saved" : "Watchlist"}
                              </button>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="space-y-3">
                  <div className="h-4 w-40 rounded-full bg-white/10 shimmer" />
                  {[1, 2].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="h-28 w-20 rounded-xl bg-white/10 shimmer" />
                      <div className="flex-1 space-y-3 pt-1">
                        <div className="h-4 rounded-full bg-white/10 shimmer" />
                        <div className="h-3 w-3/4 rounded-full bg-white/10 shimmer" />
                        <div className="h-8 w-24 rounded-lg bg-white/10 shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="absolute bottom-0 left-0 w-full border-t border-white/10 bg-zinc-950/90 p-4 backdrop-blur-xl"
            >
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder="Describe the feeling you want..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-4 pr-24 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute bottom-1.5 right-1.5 top-1.5 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-40"
                  style={{ background: theme.accent }}
                >
                  Match
                </button>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
