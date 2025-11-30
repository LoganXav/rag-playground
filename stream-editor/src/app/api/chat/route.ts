import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction } from "@/app/constants/prompts";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({ history: [] });

    const prompt = `
    ${systemInstruction}
    
    User request:
    ${message}
    
  `;

    const result = await chat.sendMessageStream(prompt);

    let assembled = "";

    for await (const chunk of result.stream) {
      const txt = chunk.text();
      if (!txt) continue;

      assembled += txt;
    }

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
