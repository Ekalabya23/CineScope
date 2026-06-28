import { Router } from "express";
import {
  createReelClip,
  getReelContext,
  getReelFeed,
  getReelUploadSignature,
  inferReelMoodTags,
  likeReel,
  logReelInteraction,
  unlikeReel,
  uploadReelClip,
} from "../controllers/reels.controller";
import { protect } from "../middleware/auth.middleware";
import { AppError } from "../utils/appError";
import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

router.use(protect);

const adminOnly = (req: any, _res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access is required to curate reel clips.", 403));
  }
  next();
};

router.route("/").post(adminOnly, createReelClip);
router.get("/upload-signature", adminOnly, getReelUploadSignature);
router.post("/upload", adminOnly, upload.single("video"), uploadReelClip);
router.get("/mood-tags", adminOnly, inferReelMoodTags);
router.get("/feed", getReelFeed);
router.post("/:id/interaction", logReelInteraction);
router.post("/:id/like", likeReel);
router.delete("/:id/like", unlikeReel);
router.get("/:id/context", getReelContext);

export default router;
