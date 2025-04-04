/**
 * @file supabase.js
 * @description This file contains the functions to connect to Supabase and fetch riddles from the database.
 */

import { createClient } from "@supabase/supabase-js";

// Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch riddles from the DB.
 * @param {number} num umber of riddles to fetch.
 * @param {boolean} debug whether to log debug information.
 * @returns an array of num riddles.
 */
export async function fetchRiddles(num, debug = false) {
  const { data: riddles, error } = await supabase
    .from("random_riddles")
    .select("*")
    .limit(num);

  if (error) {
    console.error("error fetching riddles:", error);
    return [];
  }

  if (debug) {
    console.log(`Fetched ${riddles.length} riddles`);
  }

  return riddles;
}
