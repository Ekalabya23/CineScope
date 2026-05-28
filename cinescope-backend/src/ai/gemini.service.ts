import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env";
import { SYSTEM_INSTRUCTION } from "./prompts";

// Initialize the native Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

const parseGeminiJson = (text = "{}") =>
  JSON.parse(text.trim().replace(/```json|```/g, ""));

export const GeminiService = {
  chooseNearestCanonicalTitle: async (
    enrichedContext: Record<string, any>,
  ): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Choose the nearest intended film/series/anime title from the provided candidates.
Rules:
- Return only a candidate id from the list.
- Do not invent a title.
- If no candidate is close enough, return null.

Return ONLY valid JSON:
{
  "candidateId": "canonical-id-or-null",
  "confidence": 92,
  "reason": "short correction reason"
}

Context:
${JSON.stringify(enrichedContext, null, 2)}`,
            },
          ],
        },
      ],
    });

    return parseGeminiJson(response.text || "{}");
  },

  generateCanonicalRoadmap: async (prompt: string): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    return parseGeminiJson(response.text || "{}");
  },

  orderTrustedChronology: async (
    enrichedContext: Record<string, any>,
  ): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Create the best chronological watch order using ONLY the provided canonical entry ids.
Rules:
- Use every allowedEntry exactly once.
- Do not add new ids.
- Do not remove ids.
- Keep required dependencies before titles that depend on them.
- Prefer in-universe chronology over release year when both are known.

Return ONLY valid JSON:
{
  "orderedEntryIds": ["canonical-id"],
  "reason": "short explanation"
}

Validated canon context:
${JSON.stringify(enrichedContext, null, 2)}`,
            },
          ],
        },
      ],
    });

    return parseGeminiJson(response.text || "{}");
  },

  explainRoadmap: async (enrichedContext: Record<string, any>): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are CineScope's continuity explanation writer.
CRITICAL RULES:
- Do not add, remove, reorder, or invent watch entries.
- The backend has already validated the canon order.
- Only explain the provided entries, emotional arc, and continuity importance.

Return ONLY valid JSON:
{
  "continuityInsight": "one concise cinematic paragraph",
  "emotionalArc": ["short phase names using only provided context"],
  "nodeExplanations": {
    "canonical-entry-id": {
      "aiExplanation": "one sentence",
      "emotionalRelevance": "short phrase",
      "continuitySignificance": "short factual phrase"
    }
  },
  "narrativeProgression": {
    "summary": "one sentence",
    "phases": [{ "label": "Phase 1", "description": "short sentence" }]
  }
}

Validated canon context:
${JSON.stringify(enrichedContext, null, 2)}`,
            },
          ],
        },
      ],
    });

    return parseGeminiJson(response.text || "{}");
  },

  generateCreatorInsights: async (
    enrichedContext: Record<string, any>,
  ): Promise<any> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are CineScope's AI creator review intelligence engine.
Create concise, premium, cinematic creator insight JSON inspired by Indian entertainment creator review styles.
Do not imitate private speech exactly. Use broad public-reviewer archetypes only.

Return ONLY valid JSON in this exact shape:
{
  "criticConsensus": "one sentence",
  "audienceMood": ["short lowercase mood"],
  "creatorConsensus": ["short phrase"],
  "vibes": ["Title Case vibe"],
  "creatorHighlights": [
    {
      "creatorName": "BNFTV",
      "personality": "short label",
      "summary": "one concise cinematic sentence",
      "moodTags": ["Title Case"],
      "sentimentScore": 91,
      "recommendationVibe": "short phrase"
    }
  ],
  "featuredCreators": ["BNFTV"],
  "sentimentScore": 91,
  "emotionalImpact": 88,
  "cinematicDepth": 93,
  "recommendationConfidence": 90
}

Creator style guide and metadata:
${JSON.stringify(enrichedContext, null, 2)}`,
            },
          ],
        },
      ],
    });

    return parseGeminiJson(response.text || "{}");
  },

  analyzePrompt: async (
    userPrompt: string,
    historyContext: any[] = [],
    enrichedContext: Record<string, any> = {},
  ): Promise<any> => {
    const formattedHistory = historyContext.map((chat) => ({
      role: chat.role === "model" ? "model" : "user",
      parts: chat.parts,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}

Personalization Context:
${JSON.stringify(enrichedContext, null, 2)}

User Input: "${userPrompt}"`,
            },
          ],
        },
      ],
    });

    const responseText = response.text ? response.text.trim() : "{}";

    try {
      // Direct structural safety parse bypass
      return parseGeminiJson(responseText);
    } catch {
      return {
        intentAnalysis: "Fallback processing configuration invoked.",
        searchQuery: userPrompt,
        tmdbFilters: {
          mediaType: "movie",
          with_genres: "",
          sort_by: "popularity.desc",
        },
        explanation:
          "Here is what I gathered based on your current exploration track.",
      };
    }
  },
};
