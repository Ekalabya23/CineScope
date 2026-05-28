import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    status: "fail",
    message:
      "Too many requests from this endpoint. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour window
  max: 15, // Limit each IP to 15 login/registration requests per hour
  message: {
    status: "fail",
    message:
      "Brute-force security mitigation triggered. Too many authentication attempts.",
  },
});
