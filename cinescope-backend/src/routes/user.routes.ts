import { Router } from "express";
import {
  getTasteProfile,
  getUserAnalytics,
  getUserProfile,
  updateUserProfile,
} from "../controllers/orchestration.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.route("/profile").get(getUserProfile).patch(updateUserProfile);
router.get("/taste-profile", protect, getTasteProfile);
router.get("/analytics", getUserAnalytics);

export default router;
