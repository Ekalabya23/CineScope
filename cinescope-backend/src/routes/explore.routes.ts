import { Router } from "express";
import { getUniverseList, getUniverseDetails, getAiStoryIntelligence } from "../controllers/explore.controller";
import { protect } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.get("/universes", protect, apiRateLimiter, getUniverseList);
router.get("/universe/:id", protect, apiRateLimiter, getUniverseDetails);
router.post("/intelligence", protect, apiRateLimiter, getAiStoryIntelligence);

export default router;
