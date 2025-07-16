const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JSON_FILE = 'workouts_postpartum.json';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importWorkouts() {
  const fileContent = fs.readFileSync(JSON_FILE, 'utf-8');
  const workouts = JSON.parse(fileContent);

  for (const workout of workouts) {
    delete workout.id;
    const { error } = await supabase.from('workouts').insert([workout]);
    if (error) {
      console.error('Error inserting workout:', workout.date, error.message);
    } else {
      console.log('Inserted workout:', workout.date);
    }
  }
  console.log('Import finished.');
}

importWorkouts(); 