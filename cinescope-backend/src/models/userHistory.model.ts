import { Schema, model } from "mongoose";

const userHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaId: { type: Number, required: true },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    title: { type: String, required: true },
    posterPath: String,
    backdropPath: String,
    season: Number,
    episode: Number,
    playbackTimestamp: { type: Number, default: 0 },
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    completed: { type: Boolean, default: false },
    lastViewedAt: { type: Date, default: Date.now },
    genres: [String],
    moods: [String],
    themes: [String],
  },
  { timestamps: true },
);

userHistorySchema.index({ userId: 1, mediaId: 1, mediaType: 1 });
userHistorySchema.index({ userId: 1, lastViewedAt: -1 });

export const UserHistory = model("UserHistory", userHistorySchema);
