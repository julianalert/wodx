import { NextRequest, NextResponse } from "next/server";
import { DailyWorkout } from "../../../types";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.resolve(process.cwd(), "workouts_postpartum.json");

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const workouts: DailyWorkout[] = JSON.parse(data);
    return NextResponse.json(workouts);
  } catch (err) {
    // If file doesn't exist, return empty array
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Failed to read workouts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newWorkout: DailyWorkout = await req.json();
    let workouts: DailyWorkout[] = [];
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      workouts = JSON.parse(data);
    } catch (err) {
      // If file doesn't exist, start with empty array
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    workouts.push(newWorkout);
    await fs.writeFile(DATA_FILE, JSON.stringify(workouts, null, 2), "utf-8");
    return NextResponse.json(newWorkout, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save workout." }, { status: 500 });
  }
} 