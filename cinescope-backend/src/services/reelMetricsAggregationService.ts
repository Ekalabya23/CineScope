import { ReelClip } from "../models/reelClip.model";
import { ReelInteraction } from "../models/reelInteraction.model";

const clampRate = (value: number) => Math.max(0, Math.min(1, value));

export const ReelMetricsAggregationService = {
  refreshClipMetrics: async () => {
    const rows = await ReelInteraction.aggregate([
      {
        $group: {
          _id: "$reelId",
          total: { $sum: 1 },
          watchedFull: {
            $sum: { $cond: [{ $eq: ["$action", "watched_full"] }, 1, 0] },
          },
          tappedThrough: {
            $sum: { $cond: [{ $eq: ["$action", "tapped_through"] }, 1, 0] },
          },
          skipFast: {
            $sum: { $cond: [{ $eq: ["$action", "skip_fast"] }, 1, 0] },
          },
        },
      },
    ]);

    await Promise.all(
      rows.map((row) =>
        ReelClip.findByIdAndUpdate(row._id, {
          completionRate: clampRate(row.watchedFull / Math.max(row.total, 1)),
          tapThroughRate: clampRate(row.tappedThrough / Math.max(row.total, 1)),
          skipFastRate: clampRate(row.skipFast / Math.max(row.total, 1)),
        }),
      ),
    );

    return rows.length;
  },
};
