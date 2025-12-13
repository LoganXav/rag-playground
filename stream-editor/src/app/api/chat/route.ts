import { Database } from "@/database";
import { NextRequest } from "next/server";
import { getAiModel } from "@/lib/ai-model";
import { systemInstruction } from "@/constants/prompts";
import { buildStructuredContext, parseMarkdownToChunks } from "@/lib/chunks";

// Keep chat history in memory
const pastMessages: { role: string; parts: { text: string }[] }[] = [];

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
      });
    }

    const latestMarkdown = Database.read("editor-content");

    // Parse markdown into chunk nodes
    const allChunks = parseMarkdownToChunks(latestMarkdown);

    // Build structured LLM context
    const structuredContext = buildStructuredContext(allChunks);

    // Provide IDs for the LLM to reference in its edit instructions
    const allChunkIds = allChunks.map((c) => c.id).join(", ");

    const prompt = `
    ${systemInstruction}
    
    You are a structured document editor. Your task is to help modify a Markdown-based document that is internally represented as discrete chunks, each with a unique ID and type (paragraph, heading, etc.). 
    
    User request:
    ${message}
    
    Document chunks available:
    ${structuredContext}
    
    Valid chunk IDs you can edit:
    ${allChunkIds}
   `;

    const model = getAiModel();
    const chat = model.startChat({ history: pastMessages });

    const result = await chat.sendMessageStream(prompt);

    // Accumulate the text here for saving into history.
    let fullAssistantReply = "";

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (!text) continue;

          fullAssistantReply += text;
          controller.enqueue(encoder.encode(text));
        }

        pastMessages.push({
          role: "user",
          parts: [{ text: message }],
        });

        pastMessages.push({
          role: "model",
          parts: [{ text: fullAssistantReply }],
        });

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
