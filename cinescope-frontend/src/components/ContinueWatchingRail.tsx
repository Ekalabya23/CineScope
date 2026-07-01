import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getBackdropPath, getMediaType, getTitle, imageUrl } from "../utils/media";

export const ContinueWatchingRail: React.FC<{ items: any[] }> = ({ items }) => {
  const navigate = useNavigate();

  if (!items?.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300">
          Smart continuation
        </p>
        <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
          Continue Watching
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => (
          <motion.article
            key={`${item.mediaId}-${item.mediaType}`}
            whileHover={{ y: -6 }}
            className="relative w-64 sm:w-72 flex-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
          >
            <div className="aspect-video bg-zinc-900">
              <img
                src={imageUrl(getBackdropPath(item), "w780")}
                alt={getTitle(item)}
                className="h-full w-full object-cover opacity-75"
              />
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-black text-white">{getTitle(item)}</h3>
                <span className="rounded bg-white/10 px-2 py-1 text-[9px] font-bold uppercase text-zinc-300">
                  {getMediaType(item)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(100, item.progressPercentage || 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>{Math.round(item.progressPercentage || 0)}% watched</span>
                {item.season && <span>S{item.season} E{item.episode || 1}</span>}
              </div>
              <button
                onClick={() =>
                  navigate(`/media/${item.mediaType || "movie"}/${item.mediaId}`)
                }
                className="mt-2 min-h-[44px] w-full rounded-xl bg-white text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-zinc-200"
              >
                View Details
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
