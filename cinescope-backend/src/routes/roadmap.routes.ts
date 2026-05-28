import { Router } from "express";
import { generateRoadmap } from "../controllers/roadmap.controller";
import { protect } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.post("/generate", protect, apiRateLimiter, generateRoadmap);

export default router;
