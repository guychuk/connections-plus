import { shuffleBoard, setThemeBasedOnPreference } from "./components/ui";
import { containsDulpicates } from "./core/utils";
import config from "./config/config.json";
import { createClient } from "@supabase/supabase-js";
import { initializeGame, resetGame } from "./core/gameLogic";
import { clickSubmit } from "./events/events";

// Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Set the theme togggle button functionality and the initial text based on the current theme

const themeToggleButton = document.getElementById("theme-toggle-button");
themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});

// Set the theme based on the user's preference

setThemeBasedOnPreference();

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    setThemeBasedOnPreference();
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

  let allTiles = result.tiles;
  let remainngTiles = new Set(allTiles);
  let positions = result.positions;

  const tileSize = result.tileSize;
  const selectedTiles = result.selectedTiles;

  const previousSubmissions = new Set();
  const completedGroups = Array.from({ length: GROUPS.length }, () => ({
    tiles: [],
    button: null,
  }));

  // Add the shuffle button functionality
  const shuffleButton = document.getElementById("shuffle-button");
  shuffleButton.addEventListener("click", () => {
    shuffleBoard(remainngTiles, positions, tileSize, H_GAP, V_GAP);
  });

  // Add the new game button functionality
  const newGameButton = document.getElementById("new-game-button");
  newGameButton.addEventListener("click", async () => {
    submitButton.disabled = true;
    shuffleButton.disabled = true;
    deselectButton.disabled = true;

    previousSubmissions.clear();
    selectedTiles.clear();

    for (let i = 0; i < completedGroups.length; i++) {
      completedGroups[i].tiles.length = 0;

      if (completedGroups[i].button) {
        completedGroups[i].button.classList.add("hidden");

        setTimeout(() => {
          completedGroups[i].button.remove();
          completedGroups[i].button = null;
        }, 500);
      }
    }

    positions = await resetGame(
      supabaseClient,
      GROUPS,
      allTiles,
      tileSize,
      H_GAP,
      V_GAP
    );

    remainngTiles = new Set(allTiles);

    submitButton.disabled = false;
    shuffleButton.disabled = false;
    deselectButton.disabled = false;
  });

  const deselectButton = document.getElementById("deselect-all-button");
  deselectButton.addEventListener("click", () => {
    for (const tile of selectedTiles) {
      tile.button.classList.remove("selected");
    }
    selectedTiles.clear();
  });

  const submitButton = document.getElementById("submit-button");
  submitButton.addEventListener("click", () => {
    positions = clickSubmit(
      board,
      remainngTiles,
      selectedTiles,
      previousSubmissions,
      completedGroups,
      GROUPS,
      submitButton,
      positions,
      tileSize,
      H_GAP,
      V_GAP
    );

    if (remainngTiles.size === 0) {
      submitButton.disabled = true;
      shuffleButton.disabled = true;
      deselectButton.disabled = true;
    }
  });
})();
