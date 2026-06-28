import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { ReelClip } from "../../hooks/useReelFeed";
import { getMoodTheme } from "../../theme/cinematicTheme";
import { imageUrl } from "../../utils/media";

type ReelInfoSheetProps = {
  clip: ReelClip | null;
  open: boolean;
  onClose: () => void;
};

export const ReelInfoSheet: React.FC<ReelInfoSheetProps> = ({ clip, open, onClose }) => {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const theme = getMoodTheme(clip?.moodTags?.[0]);

  useEffect(() => {
    if (!open || !clip) return;
    setLoading(true);
    apiClient
      .get(`/reels/${clip._id}/context`)
      .then((res) => setContext(res.data.data))
      .finally(() => setLoading(false));
  }, [open, clip]);

  const addToWatchlist = async () => {
    if (!clip) return;
    await apiClient.post("/watchlist", {
      mediaId: clip.tmdbId,
      mediaType: clip.mediaType,
      title: clip.title,
      posterPath: clip.posterPath,
    });
    await apiClient.post(`/reels/${clip._id}/interaction`, {
      action: "saved",
      watchDurationMs: 0,
    });
    setContext((value: any) => ({
      ...value,
      watchlist: { ...(value?.watchlist || {}), isSaved: true },
    }));
  };

  return (
    <AnimatePresence>
      {open && clip && (
        <>
          <motion.button
            type="button"
            aria-label="Close reel info"
            className="fixed inset-0 z-[70] bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[82svh] overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#07080c] p-5 pb-8 text-white shadow-2xl md:left-1/2 md:max-w-2xl md:-translate-x-1/2"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="flex gap-4">
              <img
                src={imageUrl(clip.posterPath, "w300")}
                alt=""
                className="h-36 w-24 flex-none rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: theme.accent }}
                >
                  From this scene
                </p>
                <h2 className="mt-1 text-2xl font-black leading-tight">{clip.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{clip.vibeLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {clip.moodTags.map((mood) => (
                    <span key={mood} className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={addToWatchlist}
                disabled={context?.watchlist?.isSaved}
                className="rounded-xl px-4 py-3 text-sm font-black text-black disabled:opacity-60"
                style={{ background: theme.accent }}
              >
                {context?.watchlist?.isSaved ? "Saved" : "Add to Watchlist"}
              </button>
              <Link
                to={`/media/${clip.mediaType}/${clip.tmdbId}`}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-black text-white"
              >
                Full Details
              </Link>
            </div>

            <section className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                Streaming
              </h3>
              {loading ? (
                <p className="mt-3 text-sm text-zinc-400">Loading providers...</p>
              ) : context?.streaming?.providers?.length ? (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {context.streaming.providers.map((provider: any) => (
                    <a
                      key={provider.provider_id}
                      href={context.streaming.link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="w-16 flex-none text-center"
                    >
                      <img
                        src={imageUrl(provider.logo_path, "w300")}
                        alt={provider.provider_name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <span className="mt-1 block truncate text-[10px] text-zinc-400">
                        {provider.provider_name}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">No streaming providers found for your region.</p>
              )}
            </section>

            {context?.similar?.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                  More like this
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {context.similar.map((item: any) => (
                    <Link key={item.id} to={`/media/${item.mediaType || clip.mediaType}/${item.id}`}>
                      <img
                        src={imageUrl(item.posterPath || item.poster_path, "w300")}
                        alt={item.title || item.name}
                        className="aspect-[2/3] rounded-xl object-cover"
                      />
                      <p className="mt-2 line-clamp-2 text-xs font-bold text-zinc-200">
                        {item.title || item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
