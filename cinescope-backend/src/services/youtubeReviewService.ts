import axios from "axios";
import { ENV } from "../config/env";

export type CreatorKey =
  | "BNFTV"
  | "PJ Explained"
  | "Yogi Bolta Hai"
  | "Filmi Indian"
  | "Suraj Kumar";

export type CreatorProfile = {
  key: CreatorKey;
  name: CreatorKey;
  personality: string;
  stylePrompt: string;
  avatarGradient: string;
};

export type YouTubeReviewSignal = {
  creator: CreatorProfile;
  videoTitle: string;
  description: string;
  channelTitle: string;
  publishedAt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export const CREATOR_PROFILES: CreatorProfile[] = [
  {
    key: "BNFTV",
    name: "BNFTV",
    personality: "Mass hype reactor",
    stylePrompt:
      "Energetic mass-audience hype, entertaining reactions, blockbuster excitement, crisp commercial pulse.",
    avatarGradient: "linear-gradient(135deg, #fb7185, #f97316)",
  },
  {
    key: "PJ Explained",
    name: "PJ Explained",
    personality: "Universe theory analyst",
    stylePrompt:
      "Cinematic universe analysis, emotional engagement, storytelling theories, deep movie interpretation.",
    avatarGradient: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
  },
  {
    key: "Yogi Bolta Hai",
    name: "Yogi Bolta Hai",
    personality: "Audience emotion voice",
    stylePrompt:
      "Audience-focused reactions, emotional entertainment commentary, direct relatable reactions.",
    avatarGradient: "linear-gradient(135deg, #22c55e, #14b8a6)",
  },
  {
    key: "Filmi Indian",
    name: "Filmi Indian",
    personality: "Mainstream drama critic",
    stylePrompt:
      "Expressive mainstream reactions, dramatic entertainment analysis, commercial cinema energy.",
    avatarGradient: "linear-gradient(135deg, #facc15, #ef4444)",
  },
  {
    key: "Suraj Kumar",
    name: "Suraj Kumar",
    personality: "Story structure decoder",
    stylePrompt:
      "Detailed movie breakdowns, storytelling-focused analysis, cinematic structure insights.",
    avatarGradient: "linear-gradient(135deg, #a3e635, #06b6d4)",
  },
];

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
    };
  }>;
};

const buildFallbackSignal = (
  creator: CreatorProfile,
  title: string,
  mediaType: string,
): YouTubeReviewSignal => ({
  creator,
  videoTitle: `${title} ${mediaType} review by ${creator.name}`,
  description: `${creator.name} style creator analysis for ${title}, focused on mood, story, entertainment value, visual ambition, and audience response.`,
  channelTitle: creator.name,
});

export const YouTubeReviewService = {
  searchCreatorReviews: async (
    title: string,
    mediaType: "movie" | "tv",
  ): Promise<YouTubeReviewSignal[]> => {
    if (!ENV.YOUTUBE_API_KEY) {
      return CREATOR_PROFILES.map((creator) =>
        buildFallbackSignal(creator, title, mediaType),
      );
    }

    const results = await Promise.all(
      CREATOR_PROFILES.map(async (creator) => {
        try {
          const response = await axios.get<YouTubeSearchResponse>(
            "https://www.googleapis.com/youtube/v3/search",
            {
              timeout: 8000,
              params: {
                key: ENV.YOUTUBE_API_KEY,
                part: "snippet",
                maxResults: 1,
                type: "video",
                q: `${title} ${mediaType} review ${creator.name}`,
              },
            },
          );

          const item = response.data.items?.[0];
          const snippet = item?.snippet;
          if (!item || !snippet) {
            return buildFallbackSignal(creator, title, mediaType);
          }

          return {
            creator,
            videoTitle: snippet.title || `${title} review`,
            description: snippet.description || "",
            channelTitle: snippet.channelTitle || creator.name,
            publishedAt: snippet.publishedAt,
            videoUrl: item.id?.videoId
              ? `https://www.youtube.com/watch?v=${item.id.videoId}`
              : undefined,
            thumbnailUrl:
              snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          };
        } catch {
          return buildFallbackSignal(creator, title, mediaType);
        }
      }),
    );

    return results;
  },
};
