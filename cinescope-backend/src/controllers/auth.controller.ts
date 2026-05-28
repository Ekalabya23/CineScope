import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/user.model";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { ENV } from "../config/env";

const signToken = (id: string) => {
  return jwt.sign({ id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        new AppError(
          "Email handle already registered under another identity.",
          400,
        ),
      );
    }

    const newUser = await User.create({ name, email, password });
    const token = signToken(newUser._id.toString());

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      },
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new AppError("Please provide email and password details.", 400),
      );
    }

    const user = await User.findOne({ email }).select("+password");
    if (
      !user ||
      !(await (user as any).correctPassword(password, user.password))
    ) {
      return next(new AppError("Incorrect credentials supplied.", 401));
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      status: "success",
      token,
      data: { user: { id: user._id, name: user.name, email: user.email } },
    });
  },
);
