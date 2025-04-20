import {
  shuffleBoard,
  setThemeBasedOnPreference,
  getDifficultyButtonText,
  disableButtons,
  enableButtons,
  clearBanners,
} from "./components/ui";
import { containsDulpicates } from "./core/utils";
import config from "./config/config.json";
import { createClient } from "@supabase/supabase-js";
import { initializeGame, resetGame, resetGameState } from "./core/gameLogic";
import {
  clickSubmit,
  clickDifficulty,
  clickSettings,
  clickError,
} from "./events/events";

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

// Set the spin functionality

const errorEmojiButton = document.getElementById("error-button");
const settingsButton = document.getElementById("settings-button");

errorEmojiButton.addEventListener("click", clickError);
settingsButton.addEventListener("click", clickSettings);

// Read game configuration

/** Number of tiles in each group */
const GROUPS = config["groups"].sort((a, b) => a - b);

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
  const difficultyButton = document.getElementById("difficulty-button");
  difficultyButton.dataset.difficulty = "easy";
  difficultyButton.textContent = getDifficultyButtonText(
    difficultyButton.dataset.difficulty
  );

  let result = await initializeGame(
    supabaseClient,
    difficultyButton,
    GROUPS,
    board,
    config["layout"],
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
    shuffleBoard(
      remainngTiles,
      positions,
      GROUPS[GROUPS.length - 1], // columns
      tileSize,
      H_GAP,
      V_GAP,
      config["layout"]
    );
  });

  // Add the new game button functionality
  const newGameButton = document.getElementById("new-game-button");
  newGameButton.addEventListener("click", async () => {
    disableButtons([
      shuffleButton,
      submitButton,
      deselectButton,
      difficultyButton,
      newGameButton,
    ]);

    clearBanners(completedGroups);
    resetGameState(previousSubmissions, selectedTiles, completedGroups);

    positions = await resetGame(
      supabaseClient,
      difficultyButton,
      remainngTiles.size === 0,
      GROUPS,
      allTiles,
      tileSize,
      config["layout"],
      H_GAP,
      V_GAP
    );

    remainngTiles = new Set(allTiles);

    enableButtons([
      shuffleButton,
      submitButton,
      deselectButton,
      difficultyButton,
      newGameButton,
    ]);
  });

  const deselectButton = document.getElementById("deselect-all-button");
  deselectButton.addEventListener("click", () => {
    for (const tile of selectedTiles) {
      tile.button.classList.remove("selected");
    }
    selectedTiles.clear();
  });

  const submitButton = document.getElementById("submit-button");
  submitButton.addEventListener("click", (event) => {
    positions = clickSubmit(
      event,
      board,
      config["layout"],
      remainngTiles,
      selectedTiles,
      previousSubmissions,
      completedGroups,
      GROUPS,
      positions,
      tileSize,
      H_GAP,
      V_GAP
    );

    if (remainngTiles.size === 0) {
      disableButtons([
        shuffleButton,
        submitButton,
        deselectButton,
        difficultyButton,
      ]);
    }
  });

  // Add the difficulty button functionality and set the initial difficulty to easy
  difficultyButton.addEventListener("click", (event) => {
    clickDifficulty(event);
    newGameButton.click();
  });
})();
