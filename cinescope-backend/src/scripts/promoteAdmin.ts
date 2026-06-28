import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/user.model";

const run = async () => {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Usage: npm run admin:promote -- user@example.com");
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: "admin" },
    { new: true },
  );

  if (!user) {
    throw new Error(`No user found for ${email}`);
  }

  console.log(`[Admin] ${user.email} is now an admin.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect();
  process.exit(1);
});
