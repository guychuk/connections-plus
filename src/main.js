import {
  setThemeBasedOnPreference,
  getTextForDifficultyButton,
  getLayout,
  drawBoard,
  setLayout,
} from "./components/ui";
import { assert, containsDulpicates } from "./core/utils";
import config from "./config/config.json";
import { createClient } from "@supabase/supabase-js";
import { initializeGame } from "./core/gameLogic";
import * as events from "./events/events";

/* ------------------------
    INITIALIZE SUPABASE
  ------------------------ */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ------------------------
    INITIALIZE GAME UI
  ------------------------ */

/* --- Initialize theme toggle button --- */

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

/* --- Initialize error and settings buttons --- */

const errorEmojiButton = document.getElementById("error-button");
const settingsButton = document.getElementById("settings-button");

errorEmojiButton.addEventListener("click", events.clickError);
settingsButton.addEventListener("click", events.clickSettings);

/* --- Initialize settings panel --- */

const blurOverlay = document.getElementById("blur-overlay");
const settingsPanel = document.getElementById("settings-panel");

// Close settings panel when clicking the blur overlay
blurOverlay.addEventListener("click", () => {
  blurOverlay.classList.remove("blurred");
  settingsPanel.classList.remove("blurred");
});

/* ------------------------
    INITIALIZE THE GAME 
  ------------------------ */

/* --- Initialize groups --- */

const groups = config["groups"].sort((a, b) => a - b);
assert(!containsDulpicates(groups), "Groups contain duplicates");

const rows = groups.length;
const cols = groups[rows - 1];

// Update groups paragraph/subtitle
const groupsParagraph = document.getElementById("subtitle");
groupsParagraph.textContent = `Group Sizes are ${groups.join(", ")}`;

/* --- Initialize board --- */

const board = document.getElementById("board");
const boardCSS = getComputedStyle(board);

const horizontalGap = parseFloat(boardCSS.columnGap);
const verticalGap = parseFloat(boardCSS.rowGap);
const gaps = { horizontal: horizontalGap, vertical: verticalGap };

/* --- Initialize difficulty and difficulty button --- */

const difficultyButton = document.getElementById("difficulty-button");
difficultyButton.dataset.difficulty = config["defaultDifficulty"];
difficultyButton.textContent = getTextForDifficultyButton(
  difficultyButton.dataset.difficulty
);

// Set initial layout

let initialLayout = getLayout();

if (!initialLayout) {
  initialLayout = setLayout(config["layout"]);
}

(async () => {
  /* ---- Initialize the game ---- */

  let { gameState, positions, tileSize } = await initializeGame(
    supabaseClient,
    difficultyButton.dataset.difficulty,
    groups,
    board,
    gaps
  );

  drawBoard(board, positions, gameState, tileSize, gaps, rows, cols);

  /* ---- Set the game control button events ---- */

  const shuffleButton = document.getElementById("shuffle-button");
  const newGameButton = document.getElementById("new-game-button");
  const deselectButton = document.getElementById("deselect-all-button");
  const submitButton = document.getElementById("submit-button");
  const solveButton = document.getElementById("solve-button");

  shuffleButton.addEventListener("click", () => {
    events.clickShuffle(
      positions,
      board,
      gameState,
      tileSize,
      gaps,
      rows,
      cols
    );
  });

  newGameButton.addEventListener("click", async () => {
    events.clickNewGame(
      shuffleButton,
      submitButton,
      deselectButton,
      difficultyButton,
      newGameButton,
      solveButton,
      gameState,
      supabaseClient,
      groups,
      positions,
      board,
      tileSize,
      gaps,
      rows,
      cols
    );
  });

  deselectButton.addEventListener("click", () => {
    events.clickDeselect(gameState.selectedTiles);
  });

  submitButton.addEventListener("click", (event) => {
    events.clickSubmit(
      event,
      board,
      gameState,
      groups,
      positions,
      tileSize,
      gaps,
      shuffleButton,
      deselectButton,
      difficultyButton
    );
  });

  difficultyButton.addEventListener("click", (event) => {
    events.clickDifficulty(event);
    newGameButton.click();
  });

  solveButton.addEventListener("click", () => {
    events.clickSolve(
      board,
      gameState,
      groups,
      positions,
      tileSize,
      gaps,
      [
        solveButton,
        shuffleButton,
        submitButton,
        deselectButton,
        difficultyButton,
      ],
      newGameButton
    );
  });

  /* ---- Set the game's apply settings button events ---- */

  const applyButton = document.getElementById("apply-button");

  applyButton.addEventListener("click", () => {
    events.clickApply(
      settingsPanel,
      blurOverlay,
      positions,
      board,
      gameState,
      tileSize,
      gaps,
      rows,
      cols
    );
  });
})();
