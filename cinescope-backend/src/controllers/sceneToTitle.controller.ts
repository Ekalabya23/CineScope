import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { identifyScene } from "../services/sceneToTitle.service";

export const handleSceneIdentification = catchAsync(
  async (req: Request, res: Response) => {
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      throw new AppError(
        "Missing required field: 'image' (base64-encoded image string).",
        400,
      );
    }

    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        throw new AppError(
          "Invalid image format. Expected base64-encoded image data.",
          400,
        );
      }
    }

    // Validate base64 isn't absurdly large (> 20MB decoded)
    const estimatedBytes = (base64Data.length * 3) / 4;
    if (estimatedBytes > 20 * 1024 * 1024) {
      throw new AppError("Image too large. Maximum size is 20MB.", 413);
    }

    const result = await identifyScene(base64Data, mimeType);

    res.status(200).json({
      status: "success",
      data: result,
    });
  },
);
