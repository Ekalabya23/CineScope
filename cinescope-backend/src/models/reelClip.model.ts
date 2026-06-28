import { Schema, model } from "mongoose";

const reelClipSchema = new Schema(
  {
    videoUrl: { type: String, required: true, trim: true },
    cloudinaryPublicId: { type: String, trim: true },
    thumbnailUrl: { type: String, required: true, trim: true },
    durationMs: { type: Number, required: true, min: 1 },
    tmdbId: { type: Number, required: true, index: true },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    title: { type: String, required: true, trim: true },
    posterPath: { type: String, trim: true },
    genreIds: [{ type: Number, index: true }],
    actorIds: [{ type: Number, index: true }],
    actorNames: [{ type: String, trim: true }],
    originalLanguage: { type: String, trim: true, index: true },
    originCountries: [{ type: String, trim: true, index: true }],
    regionTags: [{ type: String, trim: true, index: true }],
    moodTags: [{ type: String, trim: true }],
    vibeLabel: { type: String, required: true, trim: true, maxlength: 80 },
    isActive: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0, index: true },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 1 },
    tapThroughRate: { type: Number, default: 0, min: 0, max: 1 },
    skipFastRate: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: true },
);

reelClipSchema.index({ isActive: 1, priority: -1, createdAt: -1 });
reelClipSchema.index({ isActive: 1, genreIds: 1 });
reelClipSchema.index({ isActive: 1, moodTags: 1 });
reelClipSchema.index({ isActive: 1, actorIds: 1 });
reelClipSchema.index({ isActive: 1, regionTags: 1 });

export const ReelClip = model("ReelClip", reelClipSchema);
