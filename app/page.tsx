"use client";
import { useState, useEffect } from "react";
import { DailyWorkout } from "../types";
import Head from "next/head";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(0); // New: page state
  const WORKOUTS_PER_PAGE = 3;

  useEffect(() => {
    async function fetchWorkouts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/workouts");
        if (!res.ok) throw new Error("Failed to fetch workouts");
        const data = await res.json();
        setWorkouts(data);
        setPage(0); // Always start at the most recent page
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkouts();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      // Only send the last 7 days as history for context
      const history = workouts.slice(-7);
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });
      if (!res.ok) throw new Error("Failed to generate workout");
      const newWorkout: DailyWorkout = await res.json();
      // Set today's date
      newWorkout.date = getTodayISO();
      // Save to /api/workouts
      const saveRes = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkout),
      });
      if (!saveRes.ok) throw new Error("Failed to save workout");
      // Refetch workouts
      const allRes = await fetch("/api/workouts");
      const allWorkouts = await allRes.json();
      setWorkouts(allWorkouts);
      setPage(0); // Reset page to 0 after new workout
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="font-sans flex flex-col items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
        <h1 className="text-3xl font-bold mb-4">WODX - Workout of the Day</h1>
        <div>Chargement des entraînements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans flex flex-col items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
        <h1 className="text-3xl font-bold mb-4">WODX - Workout of the Day</h1>
        <div className="text-red-600">Erreur : {error}</div>
        <button
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Génération en cours..." : "Générer le WOD d&apos;aujourd&apos;hui"}
        </button>
      </div>
    );
  }

  const today = getTodayISO();
  const hasToday = workouts.some(w => w.date === today);

  // Pagination logic
  const totalPages = Math.ceil(workouts.length / WORKOUTS_PER_PAGE);
  // Show most recent first: reverse the array
  const reversedWorkouts = [...workouts].reverse();
  const startIdx = page * WORKOUTS_PER_PAGE;
  const pageWorkouts = reversedWorkouts.slice(startIdx, startIdx + WORKOUTS_PER_PAGE);

  return (
    <>
      <Head>
        <title>WOD Crossfit - Programme d&apos;entraînement - WODX</title>
      </Head>
      <div className="font-sans flex flex-col items-center min-h-screen p-4 pb-20 gap-4 sm:p-8">
        {/* Header with centered logo */}
        <header className="w-full flex flex-col items-center">
          <img src="/wodx.svg" alt="Logo" className="h-16 w-16 mb-2" />
        </header>
        <h1 className="text-3xl font-bold mb-1">WOD CrossFit</h1>
        <p className="text-center text-lg text-gray-600 font-medium">Chaque jour, un nouveau WOD Crossfit.</p>
        {!hasToday && (
          <button
            className="mb-2 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Génération en cours..." : "Générer le WOD du jour"}
          </button>
        )}
        {/* Add space between hero and cards */}
        <div className="mt-3" />
        <div className="flex flex-col gap-4 w-full max-w-xl">
          {pageWorkouts.map((workout) => (
            <div key={workout.date} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">{workout.date}</h2>
              <div className="mb-4">
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                  {workout.type === 'workout' ? 'Entraînement' : 'Jour de repos'}
                </span>
              </div>
              <div className="space-y-4">
                <Section section={workout.warmup} />
                <Section section={workout.preWorkout} />
                <Section section={workout.mainWorkout} />
                <Section section={workout.cooldown} />
              </div>
              {workout.notes && (
                <div className="mt-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                  <strong>Notes&nbsp;:</strong> {workout.notes}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Pagination controls */}
        <div className="flex gap-2 mt-6">
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${i === page ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
          >
            Suivant
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ section }: { section: DailyWorkout["warmup"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
      <p className="mb-1">{section.description}</p>
      {section.duration && (
        <span className="text-xs text-gray-500">Durée : {section.duration} min</span>
      )}
    </div>
  );
}
