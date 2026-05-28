import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Chat } from "../models/chat.model";
import { GeminiService } from "../ai/gemini.service";
import { TmdbService } from "../services/tmdb.service";
import { AiContextBuilder } from "../services/aiContextBuilder";
import { AiInteraction } from "../models/aiInteraction.model";
import { RecommendationScorer } from "../services/recommendationScorer";
import { formatMediaItems } from "../utils/mediaFormatter";
import { catchAsync } from "../utils/catchAsync";

export const handleAiRecommendation = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { prompt } = req.body;
    const userId = req.user._id;

    if (!prompt) {
      return res
        .status(400)
        .json({ status: "fail", message: "Prompt content placeholder empty." });
    }

    // 1. Fetch Chat context history up to 6 records and enrich the AI memory payload
    const [history, enrichedContext] = await Promise.all([
      Chat.find({ userId })
      .sort({ createdAt: -1 })
        .limit(6),
      AiContextBuilder.buildContext(String(userId), prompt),
    ]);
    const orderedHistory = history.reverse();

    // 2. Dispatch configuration arrays to AI Engine
    const aiAnalysis = await GeminiService.analyzePrompt(
      prompt,
      orderedHistory,
      enrichedContext,
    );

    // 3. Query TMDB based on parsed metrics
    let mediaResults = [];
    if (
      aiAnalysis.tmdbFilters &&
      (aiAnalysis.tmdbFilters.with_genres || aiAnalysis.tmdbFilters.mediaType)
    ) {
      mediaResults = await TmdbService.discoverMedia(aiAnalysis.tmdbFilters);
    } else {
      mediaResults = await TmdbService.searchMulti(aiAnalysis.searchQuery);
    }

    const scoredResults = formatMediaItems(mediaResults.slice(0, 10), (item) =>
      RecommendationScorer.scoreItem(item, enrichedContext, {
        mood: enrichedContext.dominantMood,
        themes: enrichedContext.preferredThemes,
        recommendationReason:
          aiAnalysis.explanation ||
          "AI-curated from your prompt and behavioral taste context.",
      }),
    );

    // 4. Save interactions downstream inside database
    await Promise.all([
      Chat.create({ userId, role: "user", parts: [{ text: prompt }] }),
      Chat.create({
        userId,
        role: "model",
        parts: [
          { text: JSON.stringify({ explanation: aiAnalysis.explanation }) },
        ],
      }),
      AiInteraction.create({
        userId,
        prompt,
        enrichedContext,
        intent: aiAnalysis.intentAnalysis,
        mood: enrichedContext.dominantMood,
        recommendationIds: scoredResults.map((item) => item.id),
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        explanation: aiAnalysis.explanation,
        intent: aiAnalysis.intentAnalysis,
        context: enrichedContext,
        results: scoredResults, // Streamline payloads down to top 10 items
      },
    });
  },
);
