import { Schema, model } from "mongoose";

const watchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaId: { type: Number, required: true }, // TMDB ID
    title: { type: String, required: true },
    posterPath: { type: String },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    isWatched: { type: Boolean, default: false },
  },
  { timestamps: true },
);

watchlistSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

export const Watchlist = model("Watchlist", watchlistSchema);
