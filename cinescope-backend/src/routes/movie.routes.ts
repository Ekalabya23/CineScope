import { Router } from "express";
import {
  getBrowseCollections,
  getCreatorInsights,
  getMediaDetails,
} from "../controllers/movie.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/browse", protect, getBrowseCollections);
router.get("/details/:id", protect, getMediaDetails);
router.get("/:id/creator-insights", protect, getCreatorInsights);

export default router;
