import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMatch, getMediaType, getPosterPath, getRecommendation, getTitle, imageUrl } from "../utils/media";

const moodPrompts = [
  "Top rated sci-fi movies from 2023",
  "Best romantic K-Dramas of the year",
  "Classic psychological thrillers",
  "Must-watch cyberpunk anime",
];

export const AiChatSidebar: React.FC = () => {
  const navigate = useNavigate();
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
          text: "I could not reach the recommendation engine. Try a simpler prompt.",
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
        className="group fixed bottom-8 right-8 z-40 hidden h-[84px] w-[84px] rounded-full text-white shadow-2xl md:grid md:place-items-center transition-transform hover:scale-110 active:scale-95"
        aria-label="Open CineScope AI"
      >
        {/* Animated glowing gradient background */}
        <div 
          className="absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" 
          style={{
            background: 'conic-gradient(from 0deg, #ff1a53, #8a1aff, #1ac6ff, #ff1a53)',
            filter: 'blur(12px)',
            animation: 'spinGlow 4s linear infinite'
          }} 
        />
        <div 
          className="absolute inset-0 rounded-full opacity-100" 
          style={{
            background: 'conic-gradient(from 0deg, #ff1a53, #8a1aff, #1ac6ff, #ff1a53)',
            animation: 'spinGlow 4s linear infinite'
          }} 
        />
        
        {/* Dark center to make it look like a ring/gem */}
        <div className="absolute inset-[3px] rounded-full bg-black/90 backdrop-blur-md z-10 grid place-items-center shadow-inner">
            <span className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff1a53] to-[#1ac6ff]">
              Ask
            </span>
        </div>
        
        {/* Tooltip */}
        <span className="pointer-events-none absolute right-[100px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur-2xl shadow-[0_0_30px_rgba(138,26,255,0.4)] transition-all group-hover:opacity-100 group-hover:right-[100px] xl:block z-0">
          CineScope Aura
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col"
          >
            <motion.div
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`siri-edge-glow ${loading ? "thinking" : ""}`} 
            />

            {/* Floating Header */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex shrink-0 items-center justify-between p-6 md:px-10"
            >
              <div>
                <h3 className="text-xl font-black tracking-tight text-white drop-shadow-lg">CineScope AI</h3>
                <p className="mt-0.5 text-xs font-bold text-zinc-300 drop-shadow-lg">
                  Aura Discovery Mode
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="grid h-12 w-12 place-items-center rounded-full bg-black/20 text-2xl text-white backdrop-blur-xl border border-white/10 transition hover:bg-black/40 hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                ×
              </button>
            </motion.div>

            {/* Main Content Area (No Box!) */}
            <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-4 md:px-10">
              <div className="mx-auto w-full max-w-5xl h-full flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="mb-12"
                    >
                      <h1 className="mb-4 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
                        What do you want to watch?
                      </h1>
                      <p className="mx-auto max-w-xl text-lg text-zinc-200 drop-shadow-lg font-medium">
                        Ask for a genre, release year, language, or specific theme, and I'll find the perfect match.
                      </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl group">
                      {/* Crazy Animated Aura */}
                      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#ff1a53] via-[#8a1aff] to-[#1ac6ff] opacity-40 blur-2xl transition-all duration-700 group-focus-within:opacity-80 group-focus-within:blur-3xl animate-pulse" />
                      
                      <div className="relative flex items-center rounded-full border border-white/20 bg-white/5 p-2.5 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all group-focus-within:border-white/50 group-focus-within:bg-black/50">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          disabled={loading}
                          autoFocus
                          placeholder="Type your prompt here..."
                          className="h-14 w-full bg-transparent px-6 text-base sm:text-lg md:text-xl font-bold text-white outline-none placeholder:text-zinc-400"
                        />
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          className="relative overflow-hidden h-14 rounded-full px-6 sm:px-10 text-sm font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                          style={{ boxShadow: `0 0 40px ${theme.accent}80` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ff1a53] to-[#8a1aff] opacity-90 transition-opacity hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                          <span className="relative z-10 drop-shadow-lg">Discover</span>
                        </button>
                      </div>
                    </form>

                    <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
                      {moodPrompts.map((prompt, i) => (
                        <motion.button
                          key={prompt}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => runPrompt(prompt)}
                          className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-xl shadow-2xl transition-all hover:bg-white/20 hover:text-white hover:border-white/40 hover:scale-105 active:scale-95"
                          style={{ boxShadow: `0 10px 30px -10px ${theme.glow}40` }}
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12 pb-40 pt-4">
                    {messages.map((msg, index) => (
                      <div key={index} className="space-y-8">
                        {msg.sender === "user" ? (
                          <div className="flex justify-end">
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="max-w-[80%] rounded-[2rem] rounded-tr-sm bg-white/90 backdrop-blur-xl px-8 py-5 text-base md:text-xl font-bold text-black shadow-2xl"
                            >
                              {msg.text}
                            </motion.div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="max-w-[95%] space-y-3 md:max-w-[85%]"
                            >
                              <div className="flex items-start gap-5">
                                <div
                                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-black text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                  style={{ background: theme.gradient }}
                                >
                                  AI
                                </div>
                                <p className="pt-2 text-base md:text-xl font-medium leading-relaxed text-white drop-shadow-md">
                                  {msg.text || "Here are the strongest matches."}
                                </p>
                              </div>
                            </motion.div>

                            {msg.results && msg.results.length > 0 && (
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {msg.results.map((movie: any, resultIndex: number) => {
                                  const recommendation = getRecommendation(movie);
                                  const match = getMatch(movie);
                                  return (
                                    <motion.article
                                      key={`${movie.id}-${resultIndex}`}
                                      initial={{ opacity: 0, y: 30 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: resultIndex * 0.08 }}
                                      onClick={() => {
                                        navigate(`/media/${getMediaType(movie)}/${movie.id}`);
                                        setIsOpen(false);
                                      }}
                                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-black/40 backdrop-blur-2xl shadow-2xl transition hover:border-white/40 hover:bg-black/60 cursor-pointer"
                                    >
                                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900/50">
                                        {movie.backdrop_path ? (
                                          <img
                                            src={imageUrl(movie.backdrop_path, "w780")}
                                            alt={getTitle(movie)}
                                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                          />
                                        ) : (
                                          <img
                                            src={imageUrl(getPosterPath(movie), "w500")}
                                            alt={getTitle(movie)}
                                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                          />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                                          <h5 className="line-clamp-2 text-xl font-black text-white drop-shadow-xl pr-3">
                                            {getTitle(movie)}
                                          </h5>
                                          {match !== null && (
                                            <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1.5 text-xs font-black text-emerald-400 backdrop-blur-md shadow-lg">
                                              {match}%
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex flex-1 flex-col p-6">
                                        <p className="line-clamp-4 flex-1 text-sm font-medium leading-relaxed text-zinc-300">
                                          {movie.overview || "No description available."}
                                        </p>

                                        <div className="mt-6 flex items-center justify-between gap-4">
                                          <div className="flex flex-1 flex-wrap gap-2 overflow-hidden">
                                            {(recommendation.emotionalTags || []).slice(0, 2).map((tag: string) => (
                                              <span
                                                key={tag}
                                                className="truncate rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-200"
                                              >
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                          <button
                                            onClick={() => toggleWatchlist(movie)}
                                            className="shrink-0 rounded-xl bg-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:scale-105 hover:bg-white/25 active:scale-95"
                                          >
                                            {watchlistIds.includes(movie.id) ? "Saved" : "+ Watchlist"}
                                          </button>
                                        </div>
                                      </div>
                                    </motion.article>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {loading && (
                      <div className="space-y-8">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 shrink-0 rounded-full bg-white/10 shimmer backdrop-blur-md" />
                          <div className="h-5 w-64 max-w-full rounded-full bg-white/10 shimmer backdrop-blur-md" />
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="flex h-[360px] flex-col rounded-[2rem] border border-white/10 bg-black/30 backdrop-blur-xl">
                              <div className="aspect-video w-full rounded-t-[2rem] bg-white/10 shimmer" />
                              <div className="flex-1 space-y-4 p-6">
                                <div className="h-5 w-3/4 rounded-full bg-white/10 shimmer" />
                                <div className="h-4 w-full rounded-full bg-white/10 shimmer" />
                                <div className="h-4 w-2/3 rounded-full bg-white/10 shimmer" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Floating Sticky Input (Only when chat active) */}
            <AnimatePresence>
              {messages.length > 0 && (
                <motion.div
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 120, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="sticky bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-3xl px-4 py-4"
                >
                  <form onSubmit={handleSubmit} className="relative group w-full">
                    {/* Crazy Animated Aura */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#ff1a53] via-[#8a1aff] to-[#1ac6ff] opacity-40 blur-xl transition-all duration-700 group-focus-within:opacity-80 group-focus-within:blur-2xl animate-pulse" />
                    
                    <div className="relative flex items-center rounded-full border border-white/20 bg-white/5 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all group-focus-within:border-white/50 group-focus-within:bg-black/60">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="What else do you want to watch?"
                        className="h-14 w-full bg-transparent pl-6 pr-4 text-lg font-bold text-white outline-none placeholder:text-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="relative overflow-hidden h-14 rounded-full px-8 text-sm font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                        style={{ boxShadow: `0 0 30px ${theme.accent}60` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff1a53] to-[#1ac6ff] opacity-90 transition-opacity hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        <span className="relative z-10 drop-shadow-md">Send</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
