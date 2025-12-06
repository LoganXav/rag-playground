import { GoogleGenerativeAI } from "@google/generative-ai";

export function getAiModel() {
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  return model;
}
