import { Router } from "express";
import {
  getPersonalizedRecommendations,
  getSimilarRecommendations,
} from "../controllers/orchestration.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/personalized", protect, getPersonalizedRecommendations);
router.get("/similar/:id", protect, getSimilarRecommendations);

export default router;
