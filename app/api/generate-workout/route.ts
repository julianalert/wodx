import { NextRequest, NextResponse } from "next/server";
import { DailyWorkout } from "../../../types";

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
Sois créatif mais toujours prudent. Quand tu vois des pattern, innove pour ne pas être répétitif. Mets du cardio si tu le peux. Sois précis dans les workout que tu crées. Ne sois pas générique. Pas exemple: Mobilité du dos avec cat-cow, respiration diaphragmatique + engagement pelvien est un mauvais workout. 3 tours : 12 assis-debout sur chaise, 10 ponts fessiers, 10 'dead bugs' bras seuls (sans lever les jambes) est un meilleur workout dans la forme. 
Tu associes une durée à chaque workout, assure toi que cette durée fait sens. Par exemple, une fois tu avais associé 16 minutes à ce workout: 3 tours : 12 assis-debout sur chaise, 10 ponts fessiers, 10 'dead bugs' bras seuls (sans lever les jambes). Mais c'est plié en 4 min max. Donc si tu mets 16 min, fais des workout de 16 min.
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