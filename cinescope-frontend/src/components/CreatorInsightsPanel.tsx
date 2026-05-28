import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type CreatorHighlight = {
  creatorName: string;
  personality: string;
  avatarGradient?: string;
  summary: string;
  moodTags: string[];
  sentimentScore: number;
  recommendationVibe: string;
  videoTitle?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export type CreatorInsights = {
  criticConsensus: string;
  audienceMood: string[];
  creatorConsensus: string[];
  vibes: string[];
  creatorHighlights: CreatorHighlight[];
  featuredCreators: string[];
  sentimentScore: number;
  emotionalImpact: number;
  cinematicDepth: number;
  recommendationConfidence: number;
};

type CreatorInsightsPanelProps = {
  insights: CreatorInsights | null;
  loading?: boolean;
  accent?: string;
};

const fallbackGradient = "linear-gradient(135deg, #f43f5e, #f59e0b)";

const creatorPhotoPath = (name: string) => {
  const photoMap: Record<string, string> = {
    BNFTV: "/creator-reviewers/bnftv.jpg",
    "PJ Explained": "/creator-reviewers/pj-explained.jpg",
    "Yogi Bolta Hai": "/creator-reviewers/yogi-bolta-hai.jpg",
    "Filmi Indian": "/creator-reviewers/filmi-indian.jpg",
    "Suraj Kumar": "/creator-reviewers/suraj-kumar.jpg",
  };

  return photoMap[name];
};

const scoreTone = (score: number) => {
  if (score >= 90) return "text-emerald-200";
  if (score >= 78) return "text-yellow-200";
  return "text-orange-200";
};

export const CreatorInsightsPanel: React.FC<CreatorInsightsPanelProps> = ({
  insights,
  loading = false,
  accent = "#e50914",
}) => {
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);
  const [missingPhotos, setMissingPhotos] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(229,9,20,0.16),transparent_32%)]" />
        <div className="relative grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="h-3 w-44 rounded-full bg-white/10 shimmer" />
            <div className="h-10 w-72 max-w-full rounded-xl bg-white/10 shimmer" />
            <div className="h-24 rounded-2xl bg-white/10 shimmer" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-32 rounded-2xl bg-white/10 shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!insights) return null;

  const metricCards = [
    ["Sentiment", insights.sentimentScore],
    ["Emotion", insights.emotionalImpact],
    ["Depth", insights.cinematicDepth],
    ["Confidence", insights.recommendationConfidence],
  ];

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090d]/80 p-5 shadow-2xl backdrop-blur-2xl md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(229,9,20,0.2),transparent_34%),radial-gradient(circle_at_0%_90%,rgba(20,184,166,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative grid w-full gap-7 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              AI creator intelligence
            </p>
            <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight text-white md:text-4xl">
              Creator Review Pulse
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
              {insights.criticConsensus}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metricCards.map(([label, value]) => (
              <motion.div
                key={label}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {label}
                </p>
                <p className={`mt-2 text-3xl font-black ${scoreTone(Number(value))}`}>
                  {value}%
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                Audience Mood
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {insights.audienceMood.map((mood) => (
                  <span
                    key={mood}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-zinc-200"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                Creator Consensus
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {insights.creatorConsensus.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold capitalize text-zinc-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {insights.vibes.map((vibe) => (
              <span
                key={vibe}
                className="rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide"
                style={{
                  borderColor: `${accent}66`,
                  color: "#fff",
                  background: `${accent}1c`,
                }}
              >
                {vibe}
              </span>
            ))}
          </div>
        </div>

        <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1 scrollbar-hide">
          {insights.creatorHighlights.map((creator, index) => {
            const isExpanded = expandedCreator === creator.creatorName;
            const manualPhoto = creatorPhotoPath(creator.creatorName);
            const photoSrc = creator.thumbnailUrl || manualPhoto;
            const showPhoto = photoSrc && !missingPhotos[creator.creatorName];

            return (
              <motion.article
                key={creator.creatorName}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.05, duration: 0.38 }}
                whileHover={{ scale: 1.012, y: -4 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-xl backdrop-blur-xl transition"
                style={{
                  boxShadow: `0 18px 48px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.02)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 14% 18%, ${accent}26, transparent 34%)`,
                  }}
                />
                <div className="relative flex gap-4">
                  <div className="flex w-20 flex-none flex-col items-center gap-2">
                    <div
                      className="grid h-16 w-16 place-items-center rounded-full p-[2px] shadow-[0_0_28px_rgba(255,255,255,0.16)]"
                      style={{ background: creator.avatarGradient || fallbackGradient }}
                    >
                      {showPhoto ? (
                        <img
                          src={photoSrc}
                          alt={creator.creatorName}
                          onError={() =>
                            setMissingPhotos((current) => ({
                              ...current,
                              [creator.creatorName]: true,
                            }))
                          }
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.24),rgba(255,255,255,0.07)_34%,rgba(0,0,0,0.35)_72%)]" />
                      )}
                    </div>
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-200">
                      AI Verified
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {creator.creatorName}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          {creator.personality}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Sentiment
                        </p>
                        <p className={`text-xl font-black ${scoreTone(creator.sentimentScore)}`}>
                          {creator.sentimentScore}%
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-zinc-200">
                      {creator.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {creator.moodTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                      <span className="text-xs font-bold text-zinc-300">
                        {creator.recommendationVibe}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCreator(isExpanded ? null : creator.creatorName)
                        }
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/20"
                      >
                        {isExpanded ? "Collapse" : "AI Notes"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                            <p className="text-xs leading-6 text-zinc-300">
                              {creator.videoTitle ||
                                "AI synthesized this creator-style insight from review metadata, mood signals, and cinematic context."}
                            </p>
                            {creator.videoUrl && (
                              <a
                                href={creator.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-black"
                              >
                                Source Video
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
