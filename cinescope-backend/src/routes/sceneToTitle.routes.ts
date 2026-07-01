import { Router } from "express";
import { handleSceneIdentification } from "../controllers/sceneToTitle.controller";
import { protect } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.post("/identify", protect, apiRateLimiter, handleSceneIdentification);

export default router;
