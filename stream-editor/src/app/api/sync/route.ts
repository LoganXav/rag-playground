import { Database } from "@/database";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    Database.update("editor-content", content);

    return new Response(null, { status: 200 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("stream route error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
    });
  }
}
