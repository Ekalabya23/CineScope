import { Schema, model } from "mongoose";

const recommendationAnalyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaId: Number,
    mediaType: { type: String, enum: ["movie", "tv", "mixed"], default: "movie" },
    title: String,
    interactionType: {
      type: String,
      enum: [
        "recommended",
        "accepted",
        "ignored",
        "saved",
        "trailer_click",
        "completed",
        "hover",
        "watchlist_add",
        "search",
      ],
      required: true,
    },
    mood: String,
    sectionTitle: String,
    score: Number,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

recommendationAnalyticsSchema.index({ userId: 1, createdAt: -1 });
recommendationAnalyticsSchema.index({ userId: 1, interactionType: 1 });

export const RecommendationAnalytics = model(
  "RecommendationAnalytics",
  recommendationAnalyticsSchema,
);
