import { Schema, model } from "mongoose";

const unifiedRecommendationEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaId: { type: Number, index: true },
    mediaType: { type: String, enum: ["movie", "tv", "mixed", "reel"], default: "movie" },
    reelId: { type: Schema.Types.ObjectId, ref: "ReelClip", index: true },
    signalType: {
      type: String,
      required: true,
      index: true,
    },
    value: { type: Number, default: 1 },
    sessionId: { type: String, index: true },
    sourceSurface: {
      type: String,
      enum: ["homepage", "recommendations", "reels", "details", "watchlist", "ai", "history"],
      default: "recommendations",
    },
    metadata: Schema.Types.Mixed,
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

unifiedRecommendationEventSchema.index({ userId: 1, occurredAt: -1 });
unifiedRecommendationEventSchema.index({ userId: 1, mediaId: 1, mediaType: 1 });
unifiedRecommendationEventSchema.index({ userId: 1, sessionId: 1, occurredAt: -1 });

export const UnifiedRecommendationEvent = model(
  "UnifiedRecommendationEvent",
  unifiedRecommendationEventSchema,
);
