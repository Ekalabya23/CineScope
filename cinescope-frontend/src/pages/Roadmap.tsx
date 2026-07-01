import React, { useMemo, useState } from "react";
import { RoadmapSearchSuggestions } from "../components/RoadmapSearchSuggestions";

import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "../api/client";
import { imageUrl } from "../utils/media";

type RoadmapMode =
  | "Essential Only"
  | "Full Experience"
  | "Chronological"
  | "Release Order"
  | "Character Journey"
  | "Emotional Arc";

type RoadmapNode = {
  id: string;
  title: string;
  mediaType: "movie" | "tv";
  posterPath?: string;
  releaseYear?: string;
  chronologyIndex?: number;
  releaseIndex?: number;
  importanceScore: number;
  requirement: "required" | "optional";
  aiExplanation: string;
  emotionalRelevance: string;
  continuitySignificance: string;
};

type RoadmapViewingItem = {
  id: string;
  title: string;
  year?: string;
  importanceLevel: "Essential" | "Recommended" | "Optional";
  continuityExplanation: string;
  emotionalRelevance: string;
  required: boolean;
  posterPath?: string;
  mediaType: "movie" | "tv";
  importanceScore: number;
};

type RoadmapPayload = {
  title: string;
  detectedTitle: string;
  franchise: string;
  normalizedQuery: string;
  matchedTitle: string;
  detectedUniverse: string;
  confidence: number;
  canonAccuracy: number;
  continuityConfidence: number;
  franchiseAccuracy: number;
  franchiseMatchScore: number;
  validationWarnings: string[];
  correctionReason?: string;
  recommendedMode: RoadmapMode;
  availableModes: RoadmapMode[];
  watchOrder: RoadmapNode[];
  essentialViewing: RoadmapViewingItem[];
  recommendedViewing: RoadmapViewingItem[];
  optionalViewing: RoadmapViewingItem[];
  emotionalArc: string[];
  continuityInsight: string;
  aiSummary: string;
  narrativeProgression: {
    summary: string;
    phases: Array<{ label: string; description: string }>;
  };
};

const defaultModes: RoadmapMode[] = [
  "Essential Only",
  "Full Experience",
  "Chronological",
  "Release Order",
  "Character Journey",
  "Emotional Arc",
];

const examples = [
  "Marvel Endgame",
  "Spider Man No Way",
  "Born Again",
  "Batman Dark Knight",
  "Loki Season",
];

const sectionStyles = {
  Essential: {
    eyebrow: "Required canon path",
    border: "border-red-300/20",
    badge: "bg-red-400/15 text-red-100",
    line: "from-red-300/80 via-red-200/40 to-transparent",
  },
  Recommended: {
    eyebrow: "Continuity enrichment",
    border: "border-sky-300/20",
    badge: "bg-sky-400/15 text-sky-100",
    line: "from-sky-300/80 via-sky-200/40 to-transparent",
  },
  Optional: {
    eyebrow: "Texture only",
    border: "border-violet-300/20",
    badge: "bg-violet-400/15 text-violet-100",
    line: "from-violet-300/80 via-violet-200/40 to-transparent",
  },
};

const modeSort = (nodes: RoadmapNode[], mode: RoadmapMode) => {
  if (mode === "Essential Only")
    return nodes.filter((node) => node.requirement === "required");
  if (mode === "Chronological") {
    return [...nodes].sort(
      (a, b) =>
        Number(a.chronologyIndex || a.releaseYear || 9999) -
        Number(b.chronologyIndex || b.releaseYear || 9999),
    );
  }
  if (mode === "Release Order") {
    return [...nodes].sort(
      (a, b) =>
        Number(a.releaseIndex || a.releaseYear || 9999) -
        Number(b.releaseIndex || b.releaseYear || 9999),
    );
  }
  if (mode === "Character Journey" || mode === "Emotional Arc") {
    return [...nodes].sort((a, b) => b.importanceScore - a.importanceScore);
  }
  return nodes;
};

const RoadmapSkeleton = () => (
  <div className="space-y-5">
    {[0, 1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-40 rounded-3xl border border-white/10 bg-white/[0.05] shimmer"
      />
    ))}
  </div>
);

export const Roadmap: React.FC = () => {
  const [title, setTitle] = useState("Daredevil: Born Again");
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapPayload | null>(null);
  const [activeMode, setActiveMode] = useState<RoadmapMode>("Essential Only");
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visibleNodes = useMemo(
    () => (roadmap ? modeSort(roadmap.watchOrder, activeMode) : []),
    [roadmap, activeMode],
  );
  const viewingSections = useMemo(
    () =>
      roadmap
        ? [
            {
              label: "Essential" as const,
              items: roadmap.essentialViewing || [],
            },
            {
              label: "Recommended" as const,
              items: roadmap.recommendedViewing || [],
            },
            {
              label: "Optional" as const,
              items: roadmap.optionalViewing || [],
            },
          ].filter((section) => section.items.length > 0)
        : [],
    [roadmap],
  );

  const generateRoadmap = async (inputTitle = title) => {
    const cleanTitle = inputTitle.trim();
    if (!cleanTitle) return;
    setSubmittedTitle(cleanTitle);
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post("/roadmap/generate", {
        query: cleanTitle,
      });
      const data = response.data.data as RoadmapPayload;
      setRoadmap(data);
      setActiveMode(data.recommendedMode || "Essential Only");
      setActiveNode(null);
    } catch (err) {
      console.error(err);
      setError("Roadmap intelligence could not resolve that title yet.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    generateRoadmap();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050609] pb-24 pt-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(229,9,20,0.24),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_50%_92%,rgba(168,85,247,0.14),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 cinematic-grain opacity-40" />

      <section className="relative z-20 mx-auto max-w-[1700px] px-5 md:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">
              AI continuity navigator
            </p>
            <h1 className="max-w-4xl text-3xl sm:text-5xl font-black leading-none text-white md:text-7xl">
              Build the perfect watch roadmap
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              Search any movie, series, anime, or franchise entry. CineScope
              detects the universe and maps what to watch before it.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onSubmit={submit}
            className="overflow-visible rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative z-40 flex-1">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What should I watch before..."
                  className="h-14 min-w-0 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-red-300/50"
                  autoComplete="off"
                />
                <RoadmapSearchSuggestions
                  query={title}
                  submittedQuery={submittedTitle}
                  isGenerating={loading}
                  onPick={(s) => {
                    setTitle(s.title);
                    generateRoadmap(s.title);
                  }}
                  className="absolute left-0 right-0 top-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl bg-white px-6 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? "Generating" : "Generate"}
              </button>
            </div>
            <div className="relative z-0 mt-3 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setTitle(example);
                    generateRoadmap(example);
                  }}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold text-zinc-200 transition hover:bg-white/20"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.form>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-12 max-w-[1700px] px-5 md:px-10 lg:px-16">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {!roadmap && !loading && (
          <div className="grid min-h-[48vh] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center backdrop-blur-2xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                Ready for continuity analysis
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Ask CineScope where the story begins.
              </h2>
            </div>
          </div>
        )}

        {loading && <RoadmapSkeleton />}

        <AnimatePresence>
          {roadmap && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              className="space-y-8"
            >
              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="rounded-[2rem] border border-white/10 bg-[#08090d]/82 p-5 backdrop-blur-2xl md:p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
                    Detected universe
                  </p>
                  <h2 className="mt-2 text-4xl font-black text-white">
                    {roadmap.franchise || roadmap.detectedUniverse}
                  </h2>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {roadmap.normalizedQuery} →{" "}
                    {roadmap.detectedTitle || roadmap.matchedTitle}
                  </p>
                  {roadmap.correctionReason && (
                    <p className="mt-2 text-xs leading-5 text-emerald-200">
                      Auto-corrected: {roadmap.correctionReason}
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    {roadmap.continuityInsight}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Canon Accuracy
                      </p>
                      <p className="mt-2 text-3xl font-black text-emerald-200">
                        {roadmap.canonAccuracy}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Continuity
                      </p>
                      <p className="mt-2 text-3xl font-black text-sky-200">
                        {roadmap.continuityConfidence}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Franchise Match
                      </p>
                      <p className="mt-2 text-3xl font-black text-violet-200">
                        {roadmap.franchiseMatchScore ||
                          roadmap.franchiseAccuracy}
                        %
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Entries
                      </p>
                      <p className="mt-2 text-3xl font-black text-white">
                        {visibleNodes.length}
                      </p>
                    </div>
                  </div>
                  {roadmap.validationWarnings?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4">
                      {roadmap.validationWarnings.map((warning) => (
                        <p
                          key={warning}
                          className="text-xs leading-5 text-yellow-100"
                        >
                          {warning}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl md:p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                    Emotional progression
                  </p>
                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
                    {roadmap.emotionalArc.map((arc, index) => (
                      <React.Fragment key={arc}>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-white">
                          {arc}
                        </div>
                        {index < roadmap.emotionalArc.length - 1 && (
                          <div className="hidden h-px flex-1 bg-gradient-to-r from-red-300/70 via-sky-300/50 to-transparent md:block" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="mt-5 text-sm leading-7 text-zinc-300">
                    {roadmap.narrativeProgression.summary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(roadmap.availableModes || defaultModes).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`rounded-full border px-4 py-2 min-h-[44px] text-[10px] font-black uppercase tracking-[0.16em] transition ${
                      activeMode === mode
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/10 text-zinc-200 hover:bg-white/20"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {viewingSections.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {viewingSections.map((section) => {
                    const style = sectionStyles[section.label];

                    return (
                      <motion.section
                        key={section.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-[1.6rem] border ${style.border} bg-white/[0.045] p-5 backdrop-blur-2xl`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                              {style.eyebrow}
                            </p>
                            <h3 className="mt-1 text-2xl font-black text-white">
                              {section.label} Viewing
                            </h3>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black ${style.badge}`}
                          >
                            {section.items.length}
                          </span>
                        </div>
                        <div
                          className={`mt-4 h-px bg-gradient-to-r ${style.line}`}
                        />
                        <div className="mt-4 space-y-3">
                          {section.items.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => setActiveNode(item.id)}
                              className="group flex w-full gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:scale-[1.01] hover:border-white/25 hover:bg-white/[0.07]"
                            >
                              <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/10 text-xs font-black text-white">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-white">
                                  {item.title}{" "}
                                  {item.year ? `(${item.year})` : ""}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                                  {item.continuityExplanation}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.section>
                    );
                  })}
                </div>
              )}

              <div className="relative rounded-[2rem] border border-white/10 bg-[#07080c]/86 p-4 backdrop-blur-2xl md:p-8">
                <div className="pointer-events-none absolute bottom-10 left-10 top-10 w-px bg-gradient-to-b from-red-300 via-sky-300 to-purple-300 md:left-1/2" />
                {visibleNodes.length === 0 && (
                  <div className="relative grid min-h-[260px] place-items-center text-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                        Continuity-safe result
                      </p>
                      <h3 className="mt-3 text-2xl font-black text-white">
                        No verified prerequisites found.
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
                        CineScope avoided creating an unverified watch order for
                        this title.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  {visibleNodes.map((node, index) => {
                    const isActive = activeNode === node.id;
                    const leftSide = index % 2 === 0;

                    return (
                      <motion.article
                        key={node.id}
                        initial={{ opacity: 0, x: leftSide ? -24 : 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.36, delay: index * 0.03 }}
                        onMouseEnter={() => setActiveNode(node.id)}
                        onMouseLeave={() => setActiveNode(null)}
                        onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                        className={`relative grid gap-4 md:w-[48%] ${
                          leftSide ? "md:mr-auto" : "md:ml-auto"
                        }`}
                      >
                        <div
                          className={`absolute top-10 hidden h-px w-[8%] bg-white/20 md:block ${leftSide ? "-right-[8%]" : "-left-[8%]"}`}
                        />
                        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl transition backdrop-blur-xl">
                          <div
                            className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                            style={{
                              background:
                                node.requirement === "required"
                                  ? "radial-gradient(circle at 18% 0%, rgba(229,9,20,.24), transparent 40%)"
                                  : "radial-gradient(circle at 18% 0%, rgba(56,189,248,.2), transparent 40%)",
                            }}
                          />
                          <div className="relative flex gap-4">
                            <div className="w-24 flex-none overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              {node.posterPath ? (
                                <img
                                  src={imageUrl(node.posterPath, "w300")}
                                  alt={node.title}
                                  className="aspect-[2/3] h-full w-full object-cover"
                                />
                              ) : (
                                <div className="aspect-[2/3] bg-white/10" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                    Step {index + 1} ·{" "}
                                    {node.releaseYear || "TBA"}
                                  </p>
                                  <h3 className="mt-1 text-xl font-black text-white">
                                    {node.title}
                                  </h3>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                                    node.requirement === "required"
                                      ? "bg-red-400/15 text-red-100"
                                      : "bg-sky-400/15 text-sky-100"
                                  }`}
                                >
                                  {node.requirement === "required"
                                    ? "Essential"
                                    : "Optional"}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-zinc-300">
                                {node.aiExplanation}
                              </p>
                              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-xl bg-black/25 p-3">
                                  <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                                    Importance
                                  </p>
                                  <p className="mt-1 text-lg font-black text-emerald-200">
                                    {node.importanceScore}%
                                  </p>
                                </div>
                                <div className="rounded-xl bg-black/25 p-3">
                                  <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                                    Emotion
                                  </p>
                                  <p className="mt-1 truncate text-xs font-bold capitalize text-white">
                                    {node.emotionalRelevance}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-black/25 p-3">
                                  <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                                    Continuity
                                  </p>
                                  <p className="mt-1 truncate text-xs font-bold capitalize text-white">
                                    {node.continuitySignificance}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="pointer-events-none absolute inset-0 rounded-3xl border border-white/30 shadow-[0_0_42px_rgba(255,255,255,0.16)]"
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
};
