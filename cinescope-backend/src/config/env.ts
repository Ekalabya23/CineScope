import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-key-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  TMDB_API_KEY: process.env.TMDB_API_KEY || "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "YOUR_CLOUDINARY_CLOUD_NAME",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "YOUR_CLOUDINARY_API_KEY",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "YOUR_CLOUDINARY_API_SECRET",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};

if (!ENV.MONGO_URI || !ENV.GEMINI_API_KEY || !ENV.TMDB_API_KEY) {
  throw new Error(
    "CRITICAL CONFIG ERROR: Missing vital environment variables in .env file.",
  );
}
