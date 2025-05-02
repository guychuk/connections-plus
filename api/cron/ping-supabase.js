import fetch from "node-fetch";

export default async function handler(req, res) {
  // Only allow GET requests for manual testing
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      message: "Supabase URL or key not set in environment variables",
    });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Simple ping to Supabase
    const response = await fetch(supabaseUrl, { headers });

    if (!response.ok) {
      throw new Error(`Supabase responded with status: ${response.status}`);
    }

    // Log the ping
    console.log(`Supabase pinged successfully at ${new Date().toISOString()}`);

    return res.status(200).json({
      success: true,
      message: "Supabase pinged successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error pinging Supabase:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to ping Supabase: ${error.message}`,
    });
  }
}
