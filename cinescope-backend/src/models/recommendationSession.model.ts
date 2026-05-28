import { Schema, model } from "mongoose";

const recommendationSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: {
      type: String,
      enum: ["homepage", "mood", "personalized", "similar", "ai"],
      required: true,
    },
    mood: String,
    prompt: String,
    sectionTitles: [String],
    recommendationIds: [Number],
    contextSnapshot: Schema.Types.Mixed,
  },
  { timestamps: true },
);

recommendationSessionSchema.index({ userId: 1, createdAt: -1 });

export const RecommendationSession = model(
  "RecommendationSession",
  recommendationSessionSchema,
);
