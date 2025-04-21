import {
  shuffleBoard,
  setThemeBasedOnPreference,
  getDifficultyButtonText,
  disableButtons,
  enableButtons,
  clearBanners,
  getLayout,
  drawBoard,
  setLayout,
} from "./components/ui";
import { containsDulpicates } from "./core/utils";
import config from "./config/config.json";
import { createClient } from "@supabase/supabase-js";
import { initializeGame, resetGame } from "./core/gameLogic";
import {
  clickSubmit,
  clickDifficulty,
  clickSettings,
  clickError,
  clickApply,
  clickShuffle,
  clickNewGame,
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
const ROWS = GROUPS.length;
const COLS = GROUPS[ROWS - 1];

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

// Set default difficulty and this button's functionality
const difficultyButton = document.getElementById("difficulty-button");
difficultyButton.dataset.difficulty = "easy";
difficultyButton.textContent = getDifficultyButtonText(
  difficultyButton.dataset.difficulty
);

// Set initial layout

let initialLayout = getLayout();

if (!initialLayout) {
  initialLayout = setLayout(config["layout"]);
}

(async () => {
  let result = await initializeGame(
    supabaseClient,
    difficultyButton,
    GROUPS,
    board,
    H_GAP,
    V_GAP
  );

  let allTiles = result.allTiles;
  let remainngTiles = new Set(allTiles);
  let selectedTiles = result.selectedTiles;

  let positions = result.positions;

  let tileSize = result.tileSize;

  let previousSubmissions = result.previousSubmissions;
  let completedGroups = result.completedGroups;

  drawBoard(
    board,
    positions,
    remainngTiles,
    completedGroups,
    tileSize,
    H_GAP,
    V_GAP,
    ROWS,
    COLS
  );

  const shuffleButton = document.getElementById("shuffle-button");
  const newGameButton = document.getElementById("new-game-button");
  const deselectButton = document.getElementById("deselect-all-button");
  const submitButton = document.getElementById("submit-button");

  const applyButton = document.getElementById("apply-button");

  shuffleButton.addEventListener("click", () => {
    clickShuffle(
      remainngTiles,
      positions,
      board,
      completedGroups,
      tileSize,
      H_GAP,
      V_GAP,
      ROWS,
      COLS
    );
  });

  // Add the new game button functionality
  newGameButton.addEventListener("click", async () => {
    clickNewGame(
      shuffleButton,
      submitButton,
      deselectButton,
      difficultyButton,
      newGameButton,
      completedGroups,
      supabaseClient,
      remainngTiles,
      GROUPS,
      allTiles,
      previousSubmissions,
      selectedTiles,
      positions,
      board,
      tileSize,
      H_GAP,
      V_GAP,
      ROWS,
      COLS
    );
  });

  deselectButton.addEventListener("click", () => {
    for (const tile of selectedTiles) {
      tile.button.classList.remove("selected");
    }
    selectedTiles.clear();
  });

  submitButton.addEventListener("click", (event) => {
    clickSubmit(
      event,
      board,
      remainngTiles,
      selectedTiles,
      previousSubmissions,
      completedGroups,
      GROUPS,
      positions,
      tileSize,
      H_GAP,
      V_GAP,
      shuffleButton,
      deselectButton,
      difficultyButton
    );

    console.log(positions);
  });

  // Add the difficulty button functionality and set the initial difficulty to easy
  difficultyButton.addEventListener("click", (event) => {
    clickDifficulty(event);
    newGameButton.click();
  });

  applyButton.addEventListener("click", () => {
    clickApply(
      remainngTiles,
      positions,
      board,
      completedGroups,
      tileSize,
      H_GAP,
      V_GAP,
      ROWS,
      COLS
    );
  });
})();
