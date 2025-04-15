import { shuffleBoard } from "./ui";
import { containsDulpicates } from "./utils";
import config from "./config/config.json";
import { createClient } from "@supabase/supabase-js";
import { initializeGame, resetGame } from "./gameLogic";
import { clickSubmit } from "./events";

// Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Set the theme togggle button functionality and the initial text based on the current theme
const themeToggleButton = document.getElementById("theme-toggle-button");
themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});

// Read game configuration

/** Number of tiles in each group */
const GROUPS = config["groups"];
GROUPS.sort();

if (containsDulpicates(GROUPS)) {
  throw new Error("Groups contain duplicates");
}

// Update subtitle to show the group sizes
const groupsParagraph = document.getElementById("subtitle");
groupsParagraph.textContent = `Group Sizes are ${GROUPS.join(", ")}`;

// Initialize the game

const board = document.getElementById("board");
const boardCSS = getComputedStyle(board);

/** The The horizontal gap between tiles. */
const H_GAP = parseFloat(boardCSS.columnGap);

/** The The vertical gap between tiles. */
const V_GAP = parseFloat(boardCSS.rowGap);

(async () => {
  let result = await initializeGame(
    supabaseClient,
    GROUPS,
    board,
    H_GAP,
    V_GAP
  );

  let remainngTiles = result.tiles;
  const buttons = result.buttons;
  const tileSize = result.tileSize;
  const positions = result.positions;
  const selectedTiles = result.selectedTiles;

  const previousSubmissions = new Set();
  const completedGroups = Array.from({ length: GROUPS.length }, () => []);

  // Add the shuffle button functionality
  const shuffleButton = document.getElementById("shuffle-button");
  shuffleButton.addEventListener("click", () => {
    shuffleBoard(buttons, positions, tileSize, H_GAP, V_GAP);
  });

  // Add the new game button functionality
  const newGameButton = document.getElementById("new-game-button");
  newGameButton.addEventListener("click", async () => {
    previousSubmissions.clear();
    selectedTiles.clear();
    completedGroups.length = 0;

    remainngTiles = resetGame(
      supabaseClient,
      GROUPS,
      buttons,
      positions,
      tileSize,
      H_GAP,
      V_GAP
    );
  });

  const deselectButton = document.getElementById("deselect-all-button");
  deselectButton.addEventListener("click", () => {
    for (const tile of selectedTiles) {
      tile.button.classList.remove("selected");
    }
    selectedTiles.clear();
  });

  const submitButton = document.getElementById("submit-button");
  submitButton.addEventListener("click", () =>
    clickSubmit(
      remainngTiles,
      selectedTiles,
      previousSubmissions,
      completedGroups,
      GROUPS,
      submitButton
    )
  );
})();
