import { Schema, model } from "mongoose";

const reelInteractionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reelId: { type: Schema.Types.ObjectId, ref: "ReelClip", required: true, index: true },
    action: {
      type: String,
      enum: ["skip_fast", "watched_full", "tapped_through", "saved", "liked", "unliked", "shared"],
      required: true,
    },
    watchDurationMs: { type: Number, default: 0, min: 0 },
    clipDurationMs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

reelInteractionSchema.index({ userId: 1, createdAt: -1 });
reelInteractionSchema.index({ reelId: 1, action: 1 });
reelInteractionSchema.index(
  { userId: 1, reelId: 1, action: 1 },
  { unique: true, partialFilterExpression: { action: "liked" } },
);

export const ReelInteraction = model("ReelInteraction", reelInteractionSchema);
