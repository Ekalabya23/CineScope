import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Info, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { ReelClip } from "../../hooks/useReelFeed";
import { getMoodTheme } from "../../theme/cinematicTheme";

type ReelCardProps = {
  clip: ReelClip;
  isActive: boolean;
  shouldLoadVideo: boolean;
  muted: boolean;
  onToggleMuted: () => void;
  onInfo: () => void;
  onLike: () => void;
};

export const ReelCard: React.FC<ReelCardProps> = ({
  clip,
  isActive,
  shouldLoadVideo,
  muted,
  onToggleMuted,
  onInfo,
  onLike,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const theme = getMoodTheme(clip.moodTags?.[0]);
  const hasLongCaption = clip.vibeLabel.length > 30;
  const compactCaption = hasLongCaption
    ? clip.vibeLabel.slice(0, 28).trim()
    : clip.vibeLabel;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo) return;

    if (isActive && !paused) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive, paused, shouldLoadVideo]);

  useEffect(() => {
    setCaptionExpanded(false);
  }, [clip._id]);

  const togglePlayback = () => {
    if (!isActive) return;
    setPaused((value) => !value);
  };

  return (
    <article className="relative h-full snap-start overflow-hidden bg-black">
      <img
        src={clip.thumbnailUrl}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70 blur-xl"
      />
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          src={clip.videoUrl}
          poster={clip.thumbnailUrl}
          playsInline
          loop
          muted={muted}
          preload={isActive ? "auto" : "metadata"}
          className="absolute inset-0 h-full w-full object-cover"
          onClick={togglePlayback}
        />
      )}
      <button
        type="button"
        aria-label={paused ? "Play reel" : "Pause reel"}
        onClick={togglePlayback}
        className="absolute inset-0 z-10"
      />

      <motion.div
        initial={false}
        animate={{ opacity: paused ? 1 : 0, scale: paused ? 1 : 0.92 }}
        className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
      >
        <div className="grid h-20 w-20 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-2xl backdrop-blur-xl">
          {paused ? <Play size={34} fill="currentColor" strokeWidth={1.8} /> : <Pause size={32} fill="currentColor" strokeWidth={1.8} />}
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[18] bg-[radial-gradient(circle_at_50%_28%,transparent_0,rgba(0,0,0,.05)_34%,rgba(0,0,0,.42)_100%)]" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-28 transition-all duration-300 sm:px-8 md:pb-9 ${
          captionExpanded ? "pt-56" : "pt-24"
        }`}
        style={{
          background: captionExpanded
            ? "linear-gradient(180deg, transparent 0%, rgba(0,0,0,.18) 16%, rgba(0,0,0,.68) 46%, rgba(0,0,0,.98) 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(0,0,0,.08) 28%, rgba(0,0,0,.5) 58%, rgba(0,0,0,.96) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-xl"
              style={{
                borderColor: theme.border,
                background: "rgba(0,0,0,.42)",
                boxShadow: `0 0 24px ${theme.glow}`,
              }}
            >
              {clip.moodTags?.[0] || "cinematic"}
            </span>
            <span className="pointer-events-auto max-w-[13rem] text-xs font-bold text-zinc-200 drop-shadow md:max-w-[11rem]">
              {captionExpanded ? (
                <span className="inline-block max-h-28 overflow-y-auto pr-1 leading-5 scrollbar-hide">
                  {clip.vibeLabel}
                </span>
              ) : (
                compactCaption
              )}
              {hasLongCaption && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCaptionExpanded((value) => !value);
                  }}
                  className="ml-1 font-black text-white/90 underline-offset-2 hover:underline"
                  aria-label={captionExpanded ? "Collapse reel caption" : "Expand reel caption"}
                >
                  {captionExpanded ? "less" : "..."}
                </button>
              )}
            </span>
          </div>
          <h2 className="max-w-[82%] text-3xl font-black leading-[1.08] text-white drop-shadow-2xl sm:text-5xl md:text-4xl">
            {clip.title}
          </h2>
        </motion.div>
      </div>

      <div className="absolute bottom-28 right-4 z-30 grid gap-3 md:bottom-10 md:right-5">
        <button
          type="button"
          onClick={onLike}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_12px_34px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/15"
          aria-label={clip.isLiked ? "Unlike reel" : "Like reel"}
          title={clip.isLiked ? "Unlike" : "Like"}
        >
          <Heart
            size={22}
            strokeWidth={2.3}
            fill={clip.isLiked ? "#fb7185" : "transparent"}
            color={clip.isLiked ? "#fb7185" : "currentColor"}
          />
          <span className="-mt-1 text-[10px] font-black leading-none text-white">
            {clip.likeCount || 0}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleMuted}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_12px_34px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/15"
          aria-label={muted ? "Unmute reel" : "Mute reel"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={21} strokeWidth={2.3} /> : <Volume2 size={21} strokeWidth={2.3} />}
        </button>
        <button
          type="button"
          onClick={onInfo}
          className="grid h-14 w-14 place-items-center rounded-full border text-black shadow-[0_16px_42px_rgba(0,0,0,.52)] transition hover:scale-105"
          style={{
            background: `linear-gradient(135deg, #ffffff, ${theme.accent})`,
            borderColor: theme.border,
            boxShadow: `0 16px 42px rgba(0,0,0,.52), 0 0 34px ${theme.glow}`,
          }}
          aria-label="Open reel info"
          title="Info"
        >
          <Info size={23} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
};
