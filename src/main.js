import { createClient } from "@supabase/supabase-js";
import { drawBoard, initializeGameUI } from "./components/ui";
import { initializeGame } from "./core/gameLogic";
import { initializeGameControls, initializeSettings } from "./events/events";
import config from "./config/config.json";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

(async () => {
  // Initialize Supabase Client
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Initialize UI
  const { groups, board, gaps } = initializeGameUI(config);

  // Initialize the game

  const defaultDifficulty = config["defaultDifficulty"];

  const { gameState, positions, boardConfig } = await initializeGame(
    config,
    supabaseClient,
    defaultDifficulty,
    groups,
    board,
    gaps
  );

  drawBoard(positions, gameState, boardConfig);

  // Add events

  initializeGameControls(
    gameState,
    boardConfig,
    positions,
    groups,
    supabaseClient
  );

  initializeSettings(positions, gameState, boardConfig);
})();
