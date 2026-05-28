import { Router } from "express";
import { handleAiRecommendation } from "../controllers/ai.controller";
import { protect } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.post("/recommend", protect, apiRateLimiter, handleAiRecommendation);

export default router;
