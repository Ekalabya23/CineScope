import { Router } from "express";
import { getHomepage } from "../controllers/orchestration.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, getHomepage);

export default router;
