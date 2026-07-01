const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function testModel(modelName) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello",
    });
    console.log(`Success: ${modelName}`);
  } catch (e) {
    if (e.message.includes("429")) {
      console.log(`Quota 429: ${modelName} - ${e.message.split('\n').slice(0,2).join(' ')}`);
    } else {
      console.log(`Error: ${modelName} - ${e.message}`);
    }
  }
}

async function run() {
  await testModel("gemini-2.5-flash-lite");
  await testModel("gemini-2.0-flash-lite");
  await testModel("gemini-flash-lite-latest");
  await testModel("gemini-2.5-pro");
}
run();
