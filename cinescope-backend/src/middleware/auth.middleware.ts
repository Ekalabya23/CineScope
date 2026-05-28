import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { AppError } from "../utils/appError";
import { User } from "../models/user.model";
import { catchAsync } from "../utils/catchAsync";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in. Please authenticate to gain access.",
          401,
        ),
      );
    }

    const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this active token no longer exists.",
          401,
        ),
      );
    }

    req.user = currentUser;
    next();
  },
);
