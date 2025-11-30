import { NextRequest } from "next/server";
import { VectorDatabase } from "@/database";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction } from "@/app/constants/prompts";
import { embedContent, runCosineSimilaritySearch } from "@/lib/process-content";

// Keep chat history in memory
const pastMessages: { role: string; parts: { text: string }[] }[] = [];

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({ history: pastMessages });

    const topK = 5;

    // Embed user prompt
    const embeddedUserMessage = await embedContent(message);

    const vectorResults = VectorDatabase.read();

    // Run a similarity search with the user's embedding against the chnks in the db to retrieve relevent cunks
    const results = vectorResults.map((entry) => {
      const score = runCosineSimilaritySearch(Array.from(embeddedUserMessage), Array.from(entry.embedding));

      return { ...entry, score };
    });

    results.sort((a, b) => b.score - a.score);

    // Obtain the relevant chunks as additional context to the llm
    const context = results.slice(0, topK).map((result) => result.chunk);

    const prompt = `
    ${systemInstruction}
    
    User request:
    ${message}

    Document context:
    ${context}
    
  `;

    const result = await chat.sendMessageStream(prompt);

    let assembled = "";

    for await (const chunk of result.stream) {
      const txt = chunk.text();
      if (!txt) continue;

      assembled += txt;
    }

    pastMessages.push({ role: "user", parts: [{ text: message }] });
    pastMessages.push({ role: "model", parts: [{ text: assembled }] });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(assembled));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("stream route error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
    });
  }
}
