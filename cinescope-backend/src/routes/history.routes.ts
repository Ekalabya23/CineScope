import { Router } from "express";
import {
  getContinueWatching,
  getHistory,
  trackInteraction,
  upsertProgress,
} from "../controllers/orchestration.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getHistory);
router.get("/continue-watching", getContinueWatching);
router.post("/progress", upsertProgress);
router.post("/interaction", trackInteraction);

export default router;
