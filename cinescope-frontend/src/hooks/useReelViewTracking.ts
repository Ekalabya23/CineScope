import { MutableRefObject, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { ReelClip } from "./useReelFeed";

type Args = {
  activeIndex: number;
  clips: ReelClip[];
  infoOpenedClipId: MutableRefObject<Set<string>>;
};

export const useReelViewTracking = ({ activeIndex, clips, infoOpenedClipId }: Args) => {
  const activeStartedAt = useRef<number>(Date.now());
  const previousClip = useRef<ReelClip | null>(null);
  const sentKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextClip = clips[activeIndex];
    const previous = previousClip.current;
    const startedAt = activeStartedAt.current;

    if (previous && previous._id !== nextClip?._id) {
      const watchDurationMs = Date.now() - startedAt;
      const watchedRatio = watchDurationMs / Math.max(previous.durationMs, 1);
      const action = infoOpenedClipId.current.has(previous._id)
        ? "tapped_through"
        : watchDurationMs < 2000
          ? "skip_fast"
          : watchedRatio >= 0.8
            ? "watched_full"
            : "skip_fast";
      const key = `${previous._id}:${action}:${Math.round(watchDurationMs / 1000)}`;

      if (!sentKeys.current.has(key)) {
        sentKeys.current.add(key);
        apiClient
          .post(`/reels/${previous._id}/interaction`, {
            action,
            watchDurationMs,
            clipDurationMs: previous.durationMs,
          })
          .catch(() => undefined);
      }
    }

    previousClip.current = nextClip || null;
    activeStartedAt.current = Date.now();
  }, [activeIndex, clips, infoOpenedClipId]);

  useEffect(() => {
    return () => {
      const previous = previousClip.current;
      if (!previous) return;
      const watchDurationMs = Date.now() - activeStartedAt.current;
      const watchedRatio = watchDurationMs / Math.max(previous.durationMs, 1);
      const action = infoOpenedClipId.current.has(previous._id)
        ? "tapped_through"
        : watchedRatio >= 0.8
          ? "watched_full"
          : "skip_fast";

      apiClient
        .post(`/reels/${previous._id}/interaction`, {
          action,
          watchDurationMs,
          clipDurationMs: previous.durationMs,
        })
        .catch(() => undefined);
    };
  }, [infoOpenedClipId]);
};
