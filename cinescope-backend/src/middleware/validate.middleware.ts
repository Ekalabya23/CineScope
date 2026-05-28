import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../utils/appError";

export const validate = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Validates req.body, req.query, and req.params dynamically based on schema definitions
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the errors cleanly into a readable string or array
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        // Pass a 400 Bad Request to your global error handler middleware
        return next(new AppError(`Validation Failed: ${errorMessages}`, 400));
      }
      return next(error);
    }
  };
};
