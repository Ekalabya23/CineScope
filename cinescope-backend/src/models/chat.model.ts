import { Schema, model } from "mongoose";

const chatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "model"], required: true },
    parts: [{ text: { type: String, required: true } }],
  },
  { timestamps: true },
);

export const Chat = model("Chat", chatSchema);
