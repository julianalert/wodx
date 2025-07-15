export interface WorkoutSection {
  title: string;         // e.g., "Warm Up", "Pre Workout", etc.
  description: string;   // Detailed instructions or exercises
  duration?: number;     // Optional: duration in minutes
  exercises?: string[];  // Optional: list of exercises
}

export interface DailyWorkout {
  date: string; // ISO date string, e.g., "2024-06-07"
  type: "workout" | "rest";
  warmup: WorkoutSection;
  preWorkout: WorkoutSection;
  mainWorkout: WorkoutSection;
  cooldown: WorkoutSection;
  notes?: string; // Optional: any extra notes for the day
} 