/**
 * Fetch riddles from the DB.
 * @param {number} num umber of riddles to fetch.
 * @param {boolean} debug whether to log debug information.
 * @returns an array of num riddles.
 */
export async function fetchRiddles(client, num, debug = false) {
  const { data: riddles, error } = await client
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
