import { NextRequest } from "next/server";
import { systemInstruction } from "@/app/constants/prompts";
import { embedContent, getRelevantChunksContext } from "@/lib/process-content";
import { getAiModel } from "@/lib/ai-model";
import { Database } from "@/database";
import {
  buildStructuredContext,
  parseMarkdownToChunks,
} from "@/lib/structured-test/chunk";

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

    const latestMarkdown = Database.read("editor-content");

    // Parse markdown into chunk nodes
    const allChunks = parseMarkdownToChunks(latestMarkdown);

    // Vector search returns full chunk objects
    const relevantChunks = getRelevantChunksContext(embeddedUserMessage);

    const flatRelevantChunks = relevantChunks.flat();

    // Build structured LLM context
    const structuredContext = buildStructuredContext(
      flatRelevantChunks,
      allChunks,
    );

    // Provide IDs for the LLM to reference in its edit instructions
    const allChunkIds = allChunks.map((c) => c.id).join(", ");

    console.log(
      { allChunks },
      "\n\n\n\n\n\n\n",
      { relevantChunks },
      "\n\n\n\n\n\n\n",
      { flatRelevantChunks },
      "\n\n\n\n\n\n\n",
      { structuredContext },
      "\n\n\n\n",
    );

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
    // const result = await chat.sendMessage(prompt);

    // // Call the text function inside response
    // const llmText = result.response.text(); // this is the actual LLM output

    // console.log(llmText);

    // return new Response(JSON.stringify({ response: llmText }), {
    //   status: 200,
    //   headers: { "Content-Type": "application/json" },
    // });

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
