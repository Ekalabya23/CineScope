import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/error.middleware";

// Routes imports
import authRoutes from "./routes/auth.routes";
import aiRoutes from "./routes/ai.routes";
import movieRoutes from "./routes/movie.routes";
import watchlistRoutes from "./routes/watchlist.routes";
import homepageRoutes from "./routes/homepage.routes";
import discoveryRoutes from "./routes/discovery.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import userRoutes from "./routes/user.routes";
import historyRoutes from "./routes/history.routes";
import roadmapRoutes from "./routes/roadmap.routes";
import searchRoutes from "./routes/search.routes";
import exploreRoutes from "./routes/explore.routes";
import reelsRoutes from "./routes/reels.routes";

const app = express();

// Secure Express headers with Helmet
app.use(helmet());

// Configure Data Sanitization against NoSQL Query Injection attacks
app.use(mongoSanitize());

// Cross-Origin Resource Sharing handling
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "10kb" }));

// Wire API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/movies", movieRoutes);
app.use("/api/v1/watchlist", watchlistRoutes);
app.use("/api/v1/homepage", homepageRoutes);
app.use("/api/v1/discovery", discoveryRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/roadmap", roadmapRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/explore", exploreRoutes);
app.use("/api/v1/reels", reelsRoutes);

// Catch-all unhandled API routes path
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Route path missing structural mapping: ${req.originalUrl}`,
  });
});

// Complete Global Error Processing Pipeline Middleware
app.use(errorHandler);

// Establish database connection and start application server
connectDB().then(() => {
  app.listen(ENV.PORT, () => {
    console.log(
      `[CineScope Server Engine] System executing on port ${ENV.PORT} inside ${ENV.NODE_ENV} environment.`,
    );
  });
});
