import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { ReelService } from "../services/reelService";

const run = async () => {
  await connectDB();
  const count = await ReelService.backfillMetadata();
  console.log(`[Reels Metadata] Backfilled ${count} reel clips.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
