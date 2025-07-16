import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { history } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenAI API key." }, { status: 500 });
  }

  const prompt = `Tu es un coach sportif spécialisé dans la reprise post-partum après césarienne. Génère un nouveau WOD (Workout of the Day) pour une femme qui reprend le sport 2 mois après une césarienne. 
Chaque séance doit inclure : un échauffement, un pré-entraînement (mobilité, respiration, plancher pelvien), un entraînement principal (mouvements fonctionnels, sans impact, sans crunchs ni exercices à risque pour la sangle abdominale), et un retour au calme (étirements, relaxation). 
Le programme doit être progressif, sécuritaire, adapté à la condition post-partum, et varier les exercices. 
Évite tout exercice à risque (pas de crunchs, pas de course rapide, pas de port de charge lourde, pas de travail intense des abdos). 
Sois créatif mais toujours prudent. 
Retourne le résultat au format JSON correspondant à ce type TypeScript :\n\n${JSON.stringify({
    date: "2024-06-08",
    type: "entraînement",
    warmup: { title: "Échauffement", description: "", duration: 0 },
    preWorkout: { title: "Pré-entraînement", description: "", duration: 0 },
    mainWorkout: { title: "Entraînement principal", description: "", duration: 0 },
    cooldown: { title: "Retour au calme", description: "", duration: 0 },
    notes: ""
  }, null, 2)}\n\nHistorique des entraînements :\n${JSON.stringify(history, null, 2)}\n\nWOD du jour :`;

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
          { role: "system", content: "Tu es un coach expert de CrossFit et de la reprise post-partum après césarienne. Tu t'exprimes uniquement en français. Toutes tes réponses doivent être en français, claires, progressives, sécuritaires et adaptées à une femme venant d'accoucher par césarienne." },
          { role: "user", content: prompt },
        ],
        temperature: 1.0,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    // Try to parse the JSON from the LLM response
    let workout;
    try {
      workout = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse workout JSON from OpenAI." }, { status: 500 });
    }

    // Save the generated workout to Supabase
    const { error: dbError } = await supabase.from('workouts').insert([workout]);
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(workout);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate workout." }, { status: 500 });
  }
} 