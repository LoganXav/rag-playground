import "dotenv/config";
import readline from "readline";
import { GoogleGenAI } from "@google/genai";

// Initialize client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Keep chat history in memory
const pastMessages: { role: string; parts: { text: string }[] }[] = [];

async function GeminiChatModel(message: string) {
  try {
    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      history: pastMessages,
    });

    // Start streaming response
    const stream = await chat.sendMessageStream({ message });

    let response = "";

    // Collect chunks
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        process.stdout.write(chunkText);
        response += chunkText;
      }
    }
    console.log("\n");

    // Save history
    pastMessages.push({ role: "user", parts: [{ text: message }] });
    pastMessages.push({ role: "model", parts: [{ text: response }] });
  } catch (err: any) {
    console.error("API Error:", err.response?.data || err.message);
  }
}

// Setup interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "You > ",
});

console.log(
  "Chat started! Type your message and press Enter. Type 'exit' to quit.\n",
);
rl.prompt();

rl.on("line", async (line: string) => {
  const input = line.trim();
  if (input.toLowerCase() === "exit") {
    rl.close();
    return;
  }

  await GeminiChatModel(input);
  rl.prompt();
});

rl.on("close", () => {
  console.log("👋 Chat ended.");
  process.exit(0);
});
