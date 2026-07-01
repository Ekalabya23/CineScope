const { GoogleGenAI } = require("@google/genai");
require("dotenv").config({ path: "cinescope-backend/.env" });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello",
    });
    console.log("Success with gemini-2.0-flash");
  } catch (e) {
    console.log("Error 2.0-flash:", e.message);
  }
}
run();
