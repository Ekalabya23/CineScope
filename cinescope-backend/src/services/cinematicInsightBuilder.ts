import { CreatorProfile, YouTubeReviewSignal } from "./youtubeReviewService";

export type CreatorHighlight = {
  creatorName: string;
  personality: string;
  avatarGradient: string;
  summary: string;
  moodTags: string[];
  sentimentScore: number;
  recommendationVibe: string;
  videoTitle?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export type CreatorInsightPayload = {
  criticConsensus: string;
  audienceMood: string[];
  creatorConsensus: string[];
  vibes: string[];
  creatorHighlights: CreatorHighlight[];
  featuredCreators: string[];
  sentimentScore: number;
  emotionalImpact: number;
  cinematicDepth: number;
  recommendationConfidence: number;
};

const styleSummary = (
  creator: CreatorProfile,
  title: string,
  vibes: string[],
): string => {
  const leadVibes = vibes.slice(0, 3).join(", ");
  const map: Record<string, string> = {
    BNFTV: `${title} lands with ${leadVibes.toLowerCase()} energy, built for viewers who want scale, emotion, and a big-screen rush.`,
    "PJ Explained": `${title} feels layered and theory-friendly, with its strongest pull coming from ${leadVibes.toLowerCase()} storytelling signals.`,
    "Yogi Bolta Hai": `${title} connects through audience emotion first, balancing relatability, tension, and repeat-discussion moments.`,
    "Filmi Indian": `${title} carries mainstream entertainment charge with dramatic highs, expressive moments, and commercial cinematic texture.`,
    "Suraj Kumar": `${title} stands out through structure, character turns, and the way its themes build cinematic impact over time.`,
  };
  return map[creator.name] || `${title} is tracking as ${leadVibes.toLowerCase()} and strongly cinematic.`;
};

export const CinematicInsightBuilder = {
  fallback: (
    media: any,
    signals: YouTubeReviewSignal[],
    vibes: string[],
    scores: {
      sentimentScore: number;
      emotionalImpact: number;
      cinematicDepth: number;
      recommendationConfidence: number;
    },
  ): CreatorInsightPayload => {
    const title = media.title || media.name || "This title";
    const creatorHighlights = signals.map((signal, index) => ({
      creatorName: signal.creator.name,
      personality: signal.creator.personality,
      avatarGradient: signal.creator.avatarGradient,
      summary: styleSummary(signal.creator, title, vibes),
      moodTags: vibes.slice(index % 2, index % 2 + 3),
      sentimentScore: Math.max(68, scores.sentimentScore - index * 2 + (index % 2) * 3),
      recommendationVibe:
        index % 2 === 0 ? "Strong watchlist energy" : "Discussion-worthy cinema",
      videoTitle: signal.videoTitle,
      videoUrl: signal.videoUrl,
      thumbnailUrl: signal.thumbnailUrl,
    }));

    return {
      criticConsensus:
        "Creators are reading this as a visually tuned, emotionally aware title with strong audience conversation potential.",
      audienceMood: vibes.slice(0, 3).map((vibe) => vibe.toLowerCase()),
      creatorConsensus: [
        "visually ambitious",
        "emotionally layered",
        "conversation-ready",
        vibes.includes("Slow Burn") ? "patiently paced" : "entertainment focused",
      ],
      vibes,
      creatorHighlights,
      featuredCreators: signals.map((signal) => signal.creator.name),
      ...scores,
    };
  },
};
