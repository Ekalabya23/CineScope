import { Schema, model } from "mongoose";

const aiInteractionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: String, required: true },
    enrichedContext: Schema.Types.Mixed,
    intent: String,
    mood: String,
    recommendationIds: [Number],
    acceptedRecommendationIds: [Number],
  },
  { timestamps: true },
);

aiInteractionSchema.index({ userId: 1, createdAt: -1 });

export const AiInteraction = model("AiInteraction", aiInteractionSchema);
