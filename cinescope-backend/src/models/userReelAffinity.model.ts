import { Schema, model } from "mongoose";

const userReelAffinitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    moodScores: { type: Map, of: Number, default: {} },
    genreScores: { type: Map, of: Number, default: {} },
    actorScores: { type: Map, of: Number, default: {} },
    countryScores: { type: Map, of: Number, default: {} },
    languageScores: { type: Map, of: Number, default: {} },
    regionScores: { type: Map, of: Number, default: {} },
    interactionCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const UserReelAffinity = model("UserReelAffinity", userReelAffinitySchema);
