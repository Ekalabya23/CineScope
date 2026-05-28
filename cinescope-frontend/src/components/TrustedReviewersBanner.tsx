import React, { useState } from "react";
import { motion } from "framer-motion";

type Reviewer = {
  name: string;
  label: string;
  image: string;
  gradient: string;
};

export const trustedIndianReviewers: Reviewer[] = [
  {
    name: "BNFTV",
    label: "Mass hype reactions",
    image: "/creator-reviewers/bnftv.jpg",
    gradient: "linear-gradient(135deg, #fb7185, #f97316)",
  },
  {
    name: "PJ Explained",
    label: "Story theories",
    image: "/creator-reviewers/pj-explained.jpg",
    gradient: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
  },
  {
    name: "Yogi Bolta Hai",
    label: "Audience pulse",
    image: "/creator-reviewers/yogi-bolta-hai.jpg",
    gradient: "linear-gradient(135deg, #22c55e, #14b8a6)",
  },
  {
    name: "Filmi Indian",
    label: "Mainstream cinema",
    image: "/creator-reviewers/filmi-indian.jpg",
    gradient: "linear-gradient(135deg, #facc15, #ef4444)",
  },
  {
    name: "Suraj Kumar",
    label: "Movie breakdowns",
    image: "/creator-reviewers/suraj-kumar.jpg",
    gradient: "linear-gradient(135deg, #a3e635, #06b6d4)",
  },
];

const ReviewerPhoto: React.FC<{ reviewer: Reviewer; sizeClass?: string }> = ({
  reviewer,
  sizeClass = "h-20 w-20",
}) => {
  const [hasImage, setHasImage] = useState(true);

  return (
    <div
      className={`grid ${sizeClass} place-items-center rounded-full p-[2px] shadow-[0_0_34px_rgba(255,255,255,0.16)]`}
      style={{ background: reviewer.gradient }}
    >
      {hasImage ? (
        <img
          src={reviewer.image}
          alt={reviewer.name}
          onError={() => setHasImage(false)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.24),rgba(255,255,255,0.07)_34%,rgba(0,0,0,0.35)_72%)]" />
      )}
    </div>
  );
};

export const TrustedReviewersBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090d]/85 p-5 shadow-2xl backdrop-blur-2xl md:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_12%_8%,rgba(229,9,20,0.24),transparent_30%),radial-gradient(circle_at_88%_72%,rgba(20,184,166,0.16),transparent_34%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
            Trusted creator reviews
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-white md:text-5xl">
            AI review intelligence from India&apos;s top movie voices
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
            CineScope blends creator-style reactions, audience mood, and cinematic analysis into one premium discovery signal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:gap-4">
          {trustedIndianReviewers.map((reviewer, index) => (
            <motion.div
              key={reviewer.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-center"
            >
              <div
                className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                style={{ background: reviewer.gradient }}
              />
              <div className="relative mx-auto flex flex-col items-center gap-3">
                <ReviewerPhoto reviewer={reviewer} />
                <div className="min-h-[54px]">
                  <h3 className="text-sm font-black text-white">{reviewer.name}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {reviewer.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
