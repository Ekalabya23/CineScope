import axios from "axios";
import { ENV } from "./src/config/env";
import { SYSTEM_INSTRUCTION } from "./src/ai/prompts";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const prompt = "Best romantic kdrama with multiple kisses in 2025";
  const systemContent = `${SYSTEM_INSTRUCTION}

Personalization Context: {}`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data.choices[0].message.content);
  } catch (error: any) {
    console.error(error?.response?.data || error.message);
  }
}
run();
