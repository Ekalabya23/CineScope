import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";

export type ReelClip = {
  _id: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationMs: number;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string;
  genreIds?: number[];
  moodTags: string[];
  vibeLabel: string;
  viewCount?: number;
  likeCount?: number;
  isLiked?: boolean;
};

export const useReelFeed = () => {
  const [clips, setClips] = useState<ReelClip[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await apiClient.get("/reels/feed", {
        params: { cursor: cursor || undefined, limit: 8 },
      });
      const nextItems: ReelClip[] = res.data.data.items || [];
      setClips((current) => {
        const seen = new Set(current.map((clip) => clip._id));
        return [...current, ...nextItems.filter((clip) => !seen.has(clip._id))];
      });
      setCursor(res.data.data.nextCursor);
      setHasMore(Boolean(res.data.data.nextCursor));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    clips.slice(0, 2).forEach((clip) => {
      const image = new Image();
      image.src = clip.thumbnailUrl;
    });
  }, [clips]);

  const updateClip = (clipId: string, patch: Partial<ReelClip>) => {
    setClips((current) =>
      current.map((clip) => (clip._id === clipId ? { ...clip, ...patch } : clip)),
    );
  };

  return { clips, loading, loadingMore, hasMore, loadMore, updateClip };
};
