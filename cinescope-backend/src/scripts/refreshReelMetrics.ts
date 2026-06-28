import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { ReelMetricsAggregationService } from "../services/reelMetricsAggregationService";

const run = async () => {
  await connectDB();
  const count = await ReelMetricsAggregationService.refreshClipMetrics();
  console.log(`[Reels Metrics] Refreshed aggregate metrics for ${count} clips.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
