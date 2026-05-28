import React from "react";
import { motion } from "framer-motion";
import { getMoodTheme } from "../theme/cinematicTheme";

export const TasteProfilePanel: React.FC<{ profile: any }> = ({ profile }) => {
  if (!profile) return null;
  const moods = profile.dominantMoods || [];
  const theme = getMoodTheme(moods[0]);
  const scores = Object.entries(profile.engagementScore || {}).slice(0, 6);

  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: theme.accent }}>
          AI taste profile
        </p>
        <h2 className="text-3xl font-black text-white">Your Cinematic Signature</h2>
        <p className="text-sm leading-6 text-zinc-400">
          {profile.behaviorSummary ||
            "CineScope is learning your emotional viewing rhythm and recommendation clusters."}
        </p>
        <div className="flex flex-wrap gap-2">
          {[...(profile.favoriteGenres || []), ...(profile.preferredThemes || [])]
            .slice(0, 8)
            .map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                {item}
              </span>
            ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Viewing pattern</p>
          <p className="mt-2 text-2xl font-black text-white">{profile.watchPattern}</p>
        </div>
        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Dominant mood</p>
          <p className="mt-2 text-2xl font-black capitalize" style={{ color: theme.accent }}>
            {moods[0]?.replace("-", " ") || "Adaptive"}
          </p>
        </div>
        <div className="sm:col-span-2 rounded-2xl bg-black/25 p-4">
          <p className="mb-4 text-[10px] uppercase tracking-wider text-zinc-500">
            Engagement radar
          </p>
          <div className="space-y-3">
            {scores.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr_42px] items-center gap-3">
                <span className="truncate text-xs capitalize text-zinc-300">{label.replace("-", " ")}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Number(value)}%` }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: getMoodTheme(label).accent }}
                  />
                </div>
                <span className="text-right text-xs font-black text-white">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
