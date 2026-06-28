import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "../api/client";
import { ReelAdminUpload } from "../components/Reels/ReelAdminUpload";
import { ReelCard } from "../components/Reels/ReelCard";
import { ReelInfoSheet } from "../components/Reels/ReelInfoSheet";
import { ReelClip, useReelFeed } from "../hooks/useReelFeed";
import { useReelViewTracking } from "../hooks/useReelViewTracking";
import { useStore } from "../store/useStore";

export const Reels: React.FC = () => {
  const { clips, loading, loadingMore, hasMore, loadMore, updateClip } = useReelFeed();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const infoOpenedClipId = useRef<Set<string>>(new Set());
  const likeInFlight = useRef<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(() => localStorage.getItem("reels-muted") !== "false");
  const [selectedClip, setSelectedClip] = useState<ReelClip | null>(null);
  const user = useStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  useReelViewTracking({ activeIndex, clips, infoOpenedClipId });

  useEffect(() => {
    localStorage.setItem("reels-muted", String(muted));
  }, [muted]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const nextIndex = Number((visible?.target as HTMLElement | undefined)?.dataset.index);
        if (!Number.isNaN(nextIndex)) setActiveIndex(nextIndex);
      },
      { root, threshold: [0.55, 0.75] },
    );

    Array.from(root.querySelectorAll("[data-reel-card]")).forEach((element) =>
      observer.observe(element),
    );

    return () => observer.disconnect();
  }, [clips.length]);

  useEffect(() => {
    if (clips.length - activeIndex <= 3 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [activeIndex, clips.length, hasMore, loadMore, loadingMore]);

  const toggleLike = async (clip: ReelClip) => {
    if (likeInFlight.current.has(clip._id)) return;
    likeInFlight.current.add(clip._id);

    const optimisticLiked = !clip.isLiked;
    const optimisticCount = Math.max((clip.likeCount || 0) + (optimisticLiked ? 1 : -1), 0);
    updateClip(clip._id, { isLiked: optimisticLiked, likeCount: optimisticCount });

    try {
      const res = optimisticLiked
        ? await apiClient.post(`/reels/${clip._id}/like`)
        : await apiClient.delete(`/reels/${clip._id}/like`);
      updateClip(clip._id, res.data.data);
    } catch {
      updateClip(clip._id, {
        isLiked: clip.isLiked,
        likeCount: clip.likeCount,
      });
    } finally {
      window.setTimeout(() => likeInFlight.current.delete(clip._id), 300);
    }
  };

  if (loading) {
    return (
      <main className="grid h-[100svh] place-items-center bg-black text-xs font-black uppercase tracking-[0.28em] text-zinc-500 md:min-h-screen">
        Loading Reels
      </main>
    );
  }

  if (clips.length === 0) {
    return (
      <main className="grid h-[100svh] place-items-center bg-black px-6 text-center text-zinc-300 md:min-h-screen">
        {isAdmin && <ReelAdminUpload onUploaded={() => window.location.reload()} />}
        <div>
          <h1 className="text-3xl font-black text-white">No reels curated yet.</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Add Cloudinary-hosted clips through the admin API to start the discovery feed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-black text-white md:grid md:min-h-screen md:place-items-center md:bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,.14),transparent_34%),radial-gradient(circle_at_20%_20%,rgba(239,68,68,.08),transparent_28%),#050609] md:px-6 md:pb-8 md:pt-24">
      {isAdmin && <ReelAdminUpload onUploaded={() => window.location.reload()} />}
      <section className="relative h-full w-full overflow-hidden bg-black md:h-[min(760px,calc(100vh-8rem))] md:w-[min(430px,calc((100vh-8rem)*0.5625))] md:min-w-[360px] md:rounded-[2.25rem] md:border md:border-white/10 md:shadow-[0_34px_100px_rgba(0,0,0,.62),0_0_0_8px_rgba(255,255,255,.035)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-40 hidden h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/20 md:block" />
        <div
          ref={containerRef}
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth scrollbar-hide"
        >
          {clips.map((clip, index) => (
            <div key={clip._id} data-reel-card data-index={index} className="h-full snap-start">
              <ReelCard
                clip={clip}
                isActive={index === activeIndex}
                shouldLoadVideo={index === activeIndex || index === activeIndex + 1}
                muted={muted}
                onToggleMuted={() => setMuted((value) => !value)}
                onInfo={() => {
                  infoOpenedClipId.current.add(clip._id);
                  setSelectedClip(clip);
                }}
                onLike={() => toggleLike(clip)}
              />
            </div>
          ))}
          {loadingMore && (
            <div className="grid h-24 place-items-center bg-black text-xs uppercase tracking-[0.24em] text-zinc-600">
              Loading more
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 hidden rounded-[2.25rem] ring-1 ring-inset ring-white/10 md:block" />
      </section>

      <div className="pointer-events-none fixed left-8 top-32 hidden max-w-xs text-zinc-400 lg:block xl:left-16">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-600">
          CineScope Reels
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-white">
          Swipe scenes. Find the title.
        </h1>
        <p className="mt-3 text-sm leading-6">
          A curated vertical discovery feed shaped like mobile reels, without taking over the whole desktop screen.
        </p>
      </div>

      <div className="pointer-events-none fixed right-8 top-32 hidden max-w-xs text-right text-zinc-500 lg:block xl:right-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">
          Scroll inside the phone frame
        </p>
      </div>

      <ReelInfoSheet
        clip={selectedClip}
        open={Boolean(selectedClip)}
        onClose={() => setSelectedClip(null)}
      />
    </main>
  );
};
