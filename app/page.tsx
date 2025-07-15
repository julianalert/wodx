"use client";
import { useState, useEffect } from "react";
import { DailyWorkout } from "../types";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchWorkouts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/workouts");
        if (!res.ok) throw new Error("Failed to fetch workouts");
        const data = await res.json();
        setWorkouts(data);
        setSelectedIndex(data.length > 0 ? data.length - 1 : 0);
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
      setSelectedIndex(allWorkouts.length - 1);
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
        <div>Loading workouts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans flex flex-col items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
        <h1 className="text-3xl font-bold mb-4">WODX - Workout of the Day</h1>
        <div className="text-red-600">Error: {error}</div>
        <button
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate Today's Workout"}
        </button>
      </div>
    );
  }

  const today = getTodayISO();
  const hasToday = workouts.some(w => w.date === today);

  const selectedWorkout = workouts[selectedIndex];

  return (
    <div className="font-sans flex flex-col items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <h1 className="text-3xl font-bold mb-4">WODX - Workout of the Day</h1>
      <div className="mb-4 flex gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
          onClick={() => setSelectedIndex((i) => Math.max(i - 1, 0))}
          disabled={selectedIndex === 0}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
          onClick={() => setSelectedIndex((i) => Math.min(i + 1, workouts.length - 1))}
          disabled={selectedIndex === workouts.length - 1}
        >
          Next
        </button>
      </div>
      {!hasToday && (
        <button
          className="mb-4 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate Today's Workout"}
        </button>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-2">{selectedWorkout.date}</h2>
        <div className="mb-4">
          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
            {selectedWorkout.type === "workout" ? "Workout" : "Rest Day"}
          </span>
        </div>
        <div className="space-y-4">
          <Section section={selectedWorkout.warmup} />
          <Section section={selectedWorkout.preWorkout} />
          <Section section={selectedWorkout.mainWorkout} />
          <Section section={selectedWorkout.cooldown} />
        </div>
        {selectedWorkout.notes && (
          <div className="mt-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            <strong>Notes:</strong> {selectedWorkout.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ section }: { section: DailyWorkout["warmup"] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">{section.title}</h3>
      <p className="mb-1">{section.description}</p>
      {section.duration && (
        <span className="text-xs text-gray-500">Duration: {section.duration} min</span>
      )}
    </div>
  );
}
