import { Router } from "express";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";
import { getSuggestions } from "../controllers/search.controller";

const router = Router();

router.get("/suggestions", apiRateLimiter, getSuggestions);

export default router;
