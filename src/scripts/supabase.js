import { createClient } from "@supabase/supabase-js";

// Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch riddles from the DB.
 * @param {number} num umber of riddles to fetch.
 * @returns an array of num riddles.
 */
export async function fetchRiddles(num) {
  const { data: riddles, error } = await supabase
    .from("random_riddles")
    .select("*")
    .limit(num);

  if (error) {
    console.error("error fetching riddles:", error);
    return [];
  }

  console.log(`Fetched ${riddles.length} riddles`);

  return riddles;
}
