import { NextRequest, NextResponse } from "next/server";
import { DailyWorkout } from "../../../types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { history } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenAI API key." }, { status: 500 });
  }

  const prompt = `Given the following workout history, generate a new daily workout for today. Each day must include: a warm up, a pre workout, a main workout, and a cooldown session. 
The program must be logic based on previous workouts and rest days, so today's workout should be influenced by the previous days. 
However, do NOT follow a predictable pattern. Be creative and surprising—introduce new movements, formats, or challenges. Avoid repeating the same structure or exercises as previous days. 
If a rest day is needed, make it a rest day. Workouts must be mostly inspired by crossfit workouts and exercises. 
Return the result as a JSON object matching this TypeScript type:\n\n${JSON.stringify({
    date: "2024-06-08",
    type: "workout",
    warmup: { title: "Warm Up", description: "", duration: 0 },
    preWorkout: { title: "Pre Workout", description: "", duration: 0 },
    mainWorkout: { title: "Main Workout", description: "", duration: 0 },
    cooldown: { title: "Cooldown", description: "", duration: 0 },
    notes: ""
  }, null, 2)}\n\nWorkout history:\n${JSON.stringify(history, null, 2)}\n\nToday's workout:`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert crossfit coach." },
          { role: "user", content: prompt },
        ],
        temperature: 1.0, // or even up to 1.2 for more surprise
        max_tokens: 1500, // or 2000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    // Try to parse the JSON from the LLM response
    let workout: DailyWorkout;
    try {
      workout = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse workout JSON from OpenAI." }, { status: 500 });
    }
    return NextResponse.json(workout);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate workout." }, { status: 500 });
  }
} 