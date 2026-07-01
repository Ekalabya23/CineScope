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
    <section className="relative space-y-5 py-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-red-400">
            Trusted creator reviews
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-white md:text-4xl">
            AI review intelligence
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            CineScope blends creator-style reactions, audience mood, and cinematic analysis into one premium discovery signal.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur">
          India's Top Voices
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto overflow-y-visible px-1 pb-4 pt-2 scrollbar-hide">
        {trustedIndianReviewers.map((reviewer, index) => (
          <motion.div
            key={reviewer.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -6, scale: 1.03 }}
            className="relative w-36 sm:w-40 flex-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-xl"
          >
            <div
              className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
              style={{ background: reviewer.gradient }}
            />
            <div className="relative mx-auto flex flex-col items-center gap-3">
              <ReviewerPhoto reviewer={reviewer} sizeClass="h-16 w-16 sm:h-20 sm:w-20" />
              <div className="min-h-[54px]">
                <h3 className="text-xs sm:text-sm font-black text-white">{reviewer.name}</h3>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                  {reviewer.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
