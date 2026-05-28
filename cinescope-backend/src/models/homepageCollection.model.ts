import { Schema, model } from "mongoose";

const homepageCollectionSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    mood: { type: String, required: true },
    emotionalTone: String,
    layout: {
      type: String,
      enum: [
        "poster-row",
        "large-carousel",
        "featured-split",
        "bento-grid",
        "cinematic-banner",
        "stacked-vertical",
      ],
      required: true,
    },
    mediaType: { type: String, enum: ["movie", "tv", "mixed"], default: "movie" },
    theme: String,
    visualTheme: String,
    genres: String,
    keywords: String,
    sorting: { type: String, default: "popularity.desc" },
    minVoteAverage: Number,
    minVoteCount: Number,
    source: {
      type: String,
      enum: [
        "trending-week",
        "trending-day",
        "top-rated",
        "new-releases",
        "most-watched",
      ],
    },
    aiStrategy: String,
    recommendationReason: String,
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 50 },
  },
  { timestamps: true },
);

homepageCollectionSchema.index({ isActive: 1, priority: 1 });

export const HomepageCollection = model(
  "HomepageCollection",
  homepageCollectionSchema,
);
