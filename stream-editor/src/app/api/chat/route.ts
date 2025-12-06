import { NextRequest } from "next/server";
import { systemInstruction } from "@/app/constants/prompts";
import { embedContent, getRelevantChunksContext } from "@/lib/process-content";
import { getAiModel } from "@/lib/ai-model";

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

    // Embed user prompt
    const embeddedUserMessage = await embedContent(message);

    // Obtain chunks of the document relevant to the user prompt
    const context = getRelevantChunksContext(embeddedUserMessage);

    const prompt = `
    ${systemInstruction}
    
    User request:
    ${message}

    Document context:
    ${context}
    
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
