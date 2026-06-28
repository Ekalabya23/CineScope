import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { ReelClip } from "../models/reelClip.model";

const seedClips = [
  {
    videoUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/cinescope/reels/dune-silence.mp4",
    thumbnailUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/so_1,w_720,c_fill/v1/cinescope/reels/dune-silence.jpg",
    durationMs: 18000,
    tmdbId: 438631,
    mediaType: "movie",
    title: "Dune",
    posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    moodTags: ["dystopian", "slow-burn"],
    vibeLabel: "Silent desert tension",
    priority: 90,
  },
  {
    videoUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/cinescope/reels/interstellar-dock.mp4",
    thumbnailUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/so_1,w_720,c_fill/v1/cinescope/reels/interstellar-dock.jpg",
    durationMs: 21000,
    tmdbId: 157336,
    mediaType: "movie",
    title: "Interstellar",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    moodTags: ["emotional", "mind-bending"],
    vibeLabel: "Cosmic pressure point",
    priority: 80,
  },
  {
    videoUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/cinescope/reels/severance-hallway.mp4",
    thumbnailUrl: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/so_1,w_720,c_fill/v1/cinescope/reels/severance-hallway.jpg",
    durationMs: 16000,
    tmdbId: 95396,
    mediaType: "tv",
    title: "Severance",
    posterPath: "/lFf6LLrQjYldcZItzOkGmMMigP7.jpg",
    moodTags: ["mind-bending", "dark"],
    vibeLabel: "Corporate dread spiral",
    priority: 70,
  },
] as const;

const run = async () => {
  await connectDB();

  await ReelClip.deleteMany({
    videoUrl: { $regex: "res.cloudinary.com/YOUR_CLOUD_NAME" },
  });
  await ReelClip.insertMany(seedClips);

  console.log(`[Reels Seed] Inserted ${seedClips.length} placeholder Cloudinary clips.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
