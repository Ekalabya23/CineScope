import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { ENV } from "../config/env";
import { AppError } from "../utils/appError";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
  secure: true,
});

type ReelUploadContext = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  moodTags: string[];
  vibeLabel: string;
};

export const CloudinaryService = {
  createReelUploadSignature: () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "cinescope/reels";
      const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, media_metadata: false },
      ENV.CLOUDINARY_API_SECRET,
    );

    return {
      cloudName: ENV.CLOUDINARY_CLOUD_NAME,
      apiKey: ENV.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      mediaMetadata: false,
      signature,
    };
  },

  uploadReelVideo: async (
    fileBuffer: Buffer,
    originalName: string,
    context: ReelUploadContext,
  ): Promise<UploadApiResponse> => {
    if (
      !ENV.CLOUDINARY_CLOUD_NAME ||
      ENV.CLOUDINARY_CLOUD_NAME === "YOUR_CLOUDINARY_CLOUD_NAME"
    ) {
      throw new AppError("Cloudinary credentials are not configured.", 500);
    }

    const safeExtension = path.extname(originalName).replace(/[^.\w]/g, "") || ".mp4";
    const tempPath = path.join(
      os.tmpdir(),
      `cinescope-reel-${Date.now()}-${crypto.randomUUID()}${safeExtension}`,
    );

    await fs.writeFile(tempPath, fileBuffer);

    try {
      const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_large(
          tempPath,
          {
            resource_type: "video",
            folder: "cinescope/reels",
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            chunk_size: 6 * 1024 * 1024,
            timeout: 300000,
            context: {
              tmdb_id: String(context.tmdbId),
              media_type: context.mediaType,
              title: context.title,
              mood_tags: context.moodTags.join(","),
              vibe_label: context.vibeLabel,
              original_filename: originalName,
            } as any,
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed."));
              return;
            }
            resolve(result);
          },
        );
      });

      return await Promise.race([
        uploadPromise,
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new AppError("Cloudinary upload timed out before receiving a response.", 504)),
            240000,
          );
        }),
      ]);
    } finally {
      await fs.unlink(tempPath).catch(() => undefined);
    }
  },

  reelThumbnailUrl: (publicId: string) =>
    cloudinary.url(publicId, {
      resource_type: "video",
      secure: true,
      format: "jpg",
      transformation: [
        {
          start_offset: "1",
          width: 720,
          height: 1280,
          crop: "fill",
          quality: "auto",
        },
      ],
    }),
};
