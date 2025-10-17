
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Assume API_KEY is set in the environment, e.g., through Vite's import.meta.env.VITE_API_KEY
// or a similar mechanism for Create React App. For this example, we'll try process.env.
// In a real Vite/CRA app, you'd use import.meta.env.VITE_GEMINI_API_KEY or process.env.REACT_APP_GEMINI_API_KEY
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;


let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("Gemini API Key not found. AI features will be disabled. Please set REACT_APP_GEMINI_API_KEY or GEMINI_API_KEY or window.GEMINI_API_KEY.");
}

export const generateListingDescription = async (prompt: string): Promise<string> => {
  if (!ai) {
    return "AI service is unavailable. Please configure API Key.";
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Correct model
      contents: `Generate a compelling and friendly room listing description based on these keywords: "${prompt}". Focus on attracting responsible tenants. Keep it under 150 words.`,
      // No thinkingConfig to use default (enabled) for higher quality.
    });
    return response.text;
  } catch (error) {
    console.error("Error generating listing description:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        return "Error: The provided API key is not valid. Please check your configuration.";
    }
    return "Failed to generate description. Please try again later.";
  }
};
