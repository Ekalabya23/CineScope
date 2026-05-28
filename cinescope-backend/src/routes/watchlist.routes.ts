import { Router } from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../controllers/watchlist.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.route("/").get(getWatchlist).post(addToWatchlist);

router.delete("/:id", removeFromWatchlist);

export default router;
