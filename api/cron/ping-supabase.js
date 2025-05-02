import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // For example, list rows from a test table
    const { data, error } = await supabase.from("ping").select("*");

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Supabase pinged successfully",
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to ping Supabase: ${error.message}`,
    });
  }
}
