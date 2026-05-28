import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validations/auth.validation";

const router = Router();

// Middleware intercepts the request to validate the fields before hitting the controller logic
router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);

export default router;
