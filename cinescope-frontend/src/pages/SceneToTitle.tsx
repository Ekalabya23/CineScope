import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../api/client";
import { useCinematicTheme } from "../context/CinematicThemeContext";

type DetectedActor = {
  name: string;
  confidence: number;
  character: string;
  tmdbId: number;
  profilePath: string;
  knownFor: string;
};

type CandidateTitle = {
  id: number;
  title: string;
  media_type: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  popularity: number;
  overview: string;
  matchedActors: string[];
  supportCount: number;
};

type SceneResult = {
  confidenceTier: "high_confidence" | "best_guess" | "no_match";
  candidateTitles: CandidateTitle[];
  detectedActors: DetectedActor[];
  sceneAnalysis: { description: string; estimatedEra: string };
};

type AppState = "upload" | "analyzing" | "results" | "error";

const ANALYSIS_STEPS = [
  { label: "Scanning image for faces", icon: "👁" },
  { label: "Identifying actors via AI", icon: "🧠" },
  { label: "Resolving TMDB identities", icon: "🔗" },
  { label: "Retrieving filmographies", icon: "🎬" },
  { label: "Intersecting filmographies", icon: "⚡" },
  { label: "Ranking candidates", icon: "🏆" },
];

const CONFIDENCE_STYLES = {
  high_confidence: {
    label: "High Confidence",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
  },
  best_guess: {
    label: "Best Guess",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
  },
  no_match: {
    label: "No Match Found",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
  },
};

export const SceneToTitle: React.FC = () => {
  const { theme } = useCinematicTheme();
  const [state, setState] = useState<AppState>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<SceneResult | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  // Animate analysis steps
  useEffect(() => {
    if (state !== "analyzing") return;
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [state]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const analyzeScene = useCallback(async () => {
    if (!imageBase64) return;
    setState("analyzing");
    setError("");
    setResult(null);

    try {
      const res = await apiClient.post("/scene-to-title/identify", {
        image: imageBase64,
      });
      if (res.data?.status === "success") {
        setResult(res.data.data);
        setState("results");
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Analysis failed. Please try again.";
      setError(message);
      setState("error");
    }
  }, [imageBase64]);

  const reset = useCallback(() => {
    setState("upload");
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError("");
    setActiveStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-[#050609] text-zinc-100 pt-28 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${theme.glow} 0%, transparent 70%)`,
          opacity: 0.15,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-6">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: theme.accent,
                boxShadow: `0 0 10px ${theme.accent}`,
              }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">
              AI Scene Intelligence
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
            Scene to{" "}
            <span
              style={{
                color: theme.accent,
                textShadow: `0 0 30px ${theme.accent}`,
              }}
            >
              Title
            </span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto">
            Upload a screenshot from any movie or TV show. Our AI identifies
            actors, cross-references filmographies, and pinpoints the exact
            title.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══════════ UPLOAD STATE ═══════════ */}
          {state === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              transition={{ duration: 0.5 }}
            >
              {!imagePreview ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative mx-auto max-w-3xl cursor-pointer"
                >
                  <motion.div
                    animate={{
                      borderColor: dragOver
                        ? theme.accent
                        : "rgba(255,255,255,0.08)",
                      boxShadow: dragOver
                        ? `0 0 60px ${theme.glow}, inset 0 0 60px ${theme.glow}`
                        : `0 0 0px transparent`,
                    }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl border-2 border-dashed bg-white/[0.02] backdrop-blur-xl p-8 sm:p-16 md:p-24 flex flex-col items-center gap-6 transition-all"
                  >
                    {/* Scanning Animation Ring */}
                    <div className="relative w-28 h-28">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 8,
                          ease: "linear",
                        }}
                        className="absolute inset-0 rounded-full border-2 border-dashed"
                        style={{ borderColor: `${theme.accent}40` }}
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 6,
                          ease: "linear",
                        }}
                        className="absolute inset-3 rounded-full border border-dashed"
                        style={{ borderColor: `${theme.accent}25` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        🎬
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-200 mb-2">
                        Tap or drop a screenshot here
                      </p>
                      <p className="text-xs text-zinc-500">
                        or click to browse · JPG, PNG, WebP supported
                      </p>
                    </div>

                    {/* Pulsing corner accents */}
                    {[
                      "top-0 left-0",
                      "top-0 right-0",
                      "bottom-0 left-0",
                      "bottom-0 right-0",
                    ].map((pos, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          delay: i * 0.5,
                        }}
                        className={`absolute ${pos} w-8 h-8`}
                        style={{
                          borderTop:
                            pos.includes("top")
                              ? `2px solid ${theme.accent}`
                              : "none",
                          borderBottom:
                            pos.includes("bottom")
                              ? `2px solid ${theme.accent}`
                              : "none",
                          borderLeft:
                            pos.includes("left")
                              ? `2px solid ${theme.accent}`
                              : "none",
                          borderRight:
                            pos.includes("right")
                              ? `2px solid ${theme.accent}`
                              : "none",
                          borderRadius: pos.includes("top")
                            ? pos.includes("left")
                              ? "12px 0 0 0"
                              : "0 12px 0 0"
                            : pos.includes("left")
                              ? "0 0 0 12px"
                              : "0 0 12px 0",
                        }}
                      />
                    ))}
                  </motion.div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Image Preview */
                <div className="max-w-3xl mx-auto">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-[50vh] md:max-h-[500px] object-contain bg-black"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Overlay info */}
                    <div className="absolute bottom-0 inset-x-0 p-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">
                          Image loaded
                        </p>
                        <p className="text-zinc-300 text-sm">
                          Ready for AI analysis
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            reset();
                          }}
                          className="px-5 py-2.5 min-h-[44px] rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition"
                        >
                          Change Image
                        </button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeScene();
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider text-white transition"
                          style={{
                            background: theme.accent,
                            boxShadow: `0 0 30px ${theme.glow}`,
                          }}
                        >
                          🔍 Analyze Scene
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════ ANALYZING STATE ═══════════ */}
          {state === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              {/* Image with scanning effect */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-10">
                <img
                  src={imagePreview!}
                  alt="Analyzing"
                  className="w-full max-h-[50vh] md:max-h-[400px] object-contain bg-black opacity-60"
                />

                {/* Scanning line */}
                <motion.div
                  ref={scanLineRef}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 right-0 h-[2px] z-20"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
                    boxShadow: `0 0 20px ${theme.accent}, 0 0 60px ${theme.accent}`,
                  }}
                />

                {/* Grid overlay */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(${theme.accent}15 1px, transparent 1px),
                      linear-gradient(90deg, ${theme.accent}15 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Corner brackets */}
                {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                    className={`absolute ${pos} w-6 h-6 z-20`}
                    style={{
                      borderTop: pos.includes("top") ? `2px solid ${theme.accent}` : "none",
                      borderBottom: pos.includes("bottom") ? `2px solid ${theme.accent}` : "none",
                      borderLeft: pos.includes("left") ? `2px solid ${theme.accent}` : "none",
                      borderRight: pos.includes("right") ? `2px solid ${theme.accent}` : "none",
                    }}
                  />
                ))}
              </div>

              {/* Analysis Steps */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ANALYSIS_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: i <= activeStep ? 1 : 0.3,
                      y: 0,
                    }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="rounded-xl border px-4 py-3 backdrop-blur-xl transition-all"
                    style={{
                      borderColor:
                        i <= activeStep
                          ? `${theme.accent}50`
                          : "rgba(255,255,255,0.05)",
                      background:
                        i <= activeStep
                          ? `${theme.accent}08`
                          : "rgba(255,255,255,0.02)",
                      boxShadow:
                        i === activeStep
                          ? `0 0 20px ${theme.glow}`
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{step.icon}</span>
                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{
                            color:
                              i <= activeStep
                                ? theme.accent
                                : "rgb(113 113 122)",
                          }}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-zinc-600">
                          {i < activeStep
                            ? "Complete"
                            : i === activeStep
                              ? "Processing..."
                              : "Pending"}
                        </p>
                      </div>
                      {i < activeStep && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto text-green-400 text-sm"
                        >
                          ✓
                        </motion.span>
                      )}
                      {i === activeStep && (
                        <div
                          className="ml-auto w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `${theme.accent} transparent ${theme.accent} ${theme.accent}` }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ RESULTS STATE ═══════════ */}
          {state === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto"
            >
              {/* Confidence Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <div
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full border"
                  style={{
                    background: CONFIDENCE_STYLES[result.confidenceTier].bg,
                    borderColor:
                      CONFIDENCE_STYLES[result.confidenceTier].border,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{
                      background:
                        CONFIDENCE_STYLES[result.confidenceTier].color,
                      boxShadow: `0 0 12px ${CONFIDENCE_STYLES[result.confidenceTier].color}`,
                    }}
                  />
                  <span
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{
                      color:
                        CONFIDENCE_STYLES[result.confidenceTier].color,
                    }}
                  >
                    {CONFIDENCE_STYLES[result.confidenceTier].label}
                  </span>
                </div>
              </motion.div>

              {/* Scene Analysis Summary */}
              {result.sceneAnalysis && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 mb-8"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-3">
                    Scene Analysis
                  </p>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-2">
                    {result.sceneAnalysis.description}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Estimated era:{" "}
                    <span className="text-zinc-300">
                      {result.sceneAnalysis.estimatedEra}
                    </span>
                  </p>
                </motion.div>
              )}

              {/* Detected Actors */}
              {result.detectedActors.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-5">
                    Detected Actors ({result.detectedActors.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.detectedActors.map((actor, i) => (
                      <motion.div
                        key={actor.tmdbId || i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
                      >
                        {actor.profilePath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`}
                            alt={actor.name}
                            className="w-full h-36 sm:h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-36 sm:h-48 bg-white/5 flex items-center justify-center text-4xl">
                            👤
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-sm font-bold text-white truncate">
                            {actor.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate mb-3">
                            as {actor.character}
                          </p>
                          {/* Confidence Bar */}
                          <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${actor.confidence}%` }}
                              transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                background: theme.accent,
                                boxShadow: `0 0 8px ${theme.glow}`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {actor.confidence}% confidence
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Titles */}
              {result.candidateTitles.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-5">
                    Matched Titles ({result.candidateTitles.length})
                  </h2>
                  <div className="flex flex-col gap-4">
                    {result.candidateTitles.map((title, i) => (
                      <motion.div
                        key={`${title.media_type}-${title.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden hover:bg-white/[0.05] transition-all group"
                      >
                        {/* Poster */}
                        <div className="w-24 md:w-32 flex-none">
                          {title.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${title.poster_path}`}
                              alt={title.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl min-h-[140px]">
                              🎬
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 py-4 pr-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-zinc-100 transition">
                                {title.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                                  {title.media_type === "tv" ? "TV Series" : "Movie"}
                                </span>
                                {title.release_date && (
                                  <span className="text-xs text-zinc-500">
                                    {title.release_date.slice(0, 4)}
                                  </span>
                                )}
                                {title.vote_average > 0 && (
                                  <span className="text-xs text-yellow-500 font-bold">
                                    ★ {title.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {i === 0 && result.confidenceTier === "high_confidence" && (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border"
                                style={{
                                  color: "#22c55e",
                                  borderColor: "rgba(34,197,94,0.3)",
                                  background: "rgba(34,197,94,0.1)",
                                }}
                              >
                                Best Match
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                            {title.overview}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                              Matched via:
                            </span>
                            {title.matchedActors.map((actor) => (
                              <span
                                key={actor}
                                className="text-[10px] px-2 py-0.5 rounded-full border text-zinc-300"
                                style={{
                                  borderColor: `${theme.accent}40`,
                                  background: `${theme.accent}10`,
                                }}
                              >
                                {actor}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Match Message */}
              {result.candidateTitles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <p className="text-5xl mb-4">🎭</p>
                  <p className="text-lg font-bold text-zinc-300 mb-2">
                    No matching titles found
                  </p>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    We couldn't find a matching movie or TV show. Try a
                    screenshot with more recognizable faces or a different angle.
                  </p>
                </motion.div>
              )}

              {/* Try Another Button */}
              <div className="flex justify-center mt-8">
                <motion.button
                  onClick={reset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 hover:bg-white/10 transition backdrop-blur-xl"
                >
                  🔄 Try Another Screenshot
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════ ERROR STATE ═══════════ */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center py-16"
            >
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-10">
                <p className="text-5xl mb-4">⚠️</p>
                <p className="text-lg font-bold text-red-400 mb-2">
                  Analysis Failed
                </p>
                <p className="text-sm text-zinc-400 mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={reset}
                    className="px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition"
                  >
                    Upload New Image
                  </button>
                  <button
                    onClick={analyzeScene}
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white transition"
                    style={{
                      background: theme.accent,
                      boxShadow: `0 0 20px ${theme.glow}`,
                    }}
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
