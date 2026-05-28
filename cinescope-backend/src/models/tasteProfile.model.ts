import { Schema, model } from "mongoose";

const tasteProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    favoriteGenres: [String],
    dominantMoods: [String],
    preferredThemes: [String],
    preferredRuntimes: {
      min: Number,
      max: Number,
      label: String,
    },
    watchPattern: String,
    engagementScore: { type: Map, of: Number, default: {} },
    behaviorSummary: String,
    lastAnalyzedAt: Date,
  },
  { timestamps: true },
);

export const TasteProfile = model("TasteProfile", tasteProfileSchema);
