// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI }    from "@google/genai";

const ai = new GoogleGenAI({    // will read process.env.GEMINI_API_KEY
  // apiKey: process.env.GEMINI_API_KEY,  // optional: explicit override
});

export async function POST(request: Request) {
  const { question } = await request.json();
  if (!question) {
    return NextResponse.json({ error: "No question provided." }, { status: 400 });
  }

  try {
    const response = await ai.models.generateContent({
      model:    "gemini-2.5-flash",    // one of the public Gemini models
      contents: question,              // your user’s prompt
    });
    return NextResponse.json({ answer: response.text });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI request failed." },
      { status: 500 }
    );
  }
}
