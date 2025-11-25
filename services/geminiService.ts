import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

export const generateSimpleSummary = async (text: string): Promise<string> => {
  if (!apiKey) return "AI Summary unavailable (No API Key).";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a very simple, easy-to-read summary of the following text for a voter with reading difficulties. Keep it under 50 words: "${text}"`,
    });
    return response.text || "Could not generate summary.";
  } catch (error: any) {
    // Suppress network errors common in some environments to avoid console noise
    console.warn("Gemini API skipped due to network/access error."); 
    return "Summary temporarily unavailable (Offline).";
  }
};

export const generateManifestoAnalysis = async (candidateName: string, party: string, manifesto: string): Promise<string> => {
  if (!apiKey) return "AI Analysis unavailable.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following manifesto for candidate ${candidateName} (${party}). highlight 3 key bullet points affecting the daily life of a citizen. Text: "${manifesto}"`,
    });
    return response.text || "Could not analyze.";
  } catch (error) {
    console.warn("Gemini API skipped due to network/access error.");
    return "Analysis unavailable (Offline).";
  }
}