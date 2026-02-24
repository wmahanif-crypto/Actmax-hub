import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "API Key is missing!" }, { status: 500 });
    }
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Detail Error from Google:", data.error);
      return NextResponse.json({ 
        text: `Error dari Google: ${data.error.message}` 
      }, { status: data.error.code || 400 });
    }

    // Pastikan path data adalah betul
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, cannot give response.";
    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ text: "failed connect: " + error.message }, { status: 500 });
  }
}