import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(
      `[Database] MongoDB Connected Successfully: ${conn.connection.host}`,
    );
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error}`);
    process.exit(1);
  }
};
