import { Router } from "express";
import { getMoodDiscovery } from "../controllers/orchestration.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/mood", protect, getMoodDiscovery);

export default router;
