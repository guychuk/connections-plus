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

// Set initial layout

let initialLayout = getLayout();

if (!initialLayout) {
  initialLayout = setLayout(config["layout"]);
}

// Get the buttons

const gameControlButtons = {
  deselect: document.getElementById("deselect-all-button"),
  difficulty: document.getElementById("difficulty-button"),
  newGame: document.getElementById("new-game-button"),
  shuffle: document.getElementById("shuffle-button"),
  solve: document.getElementById("solve-button"),
  submit: document.getElementById("submit-button"),
};

(async () => {
  /* ---- Initialize the game ---- */

  let { gameState, positions, boardConfig } = await initializeGame(
    supabaseClient,
    config["defaultDifficulty"],
    groups,
    board,
    gaps
  );

  drawBoard(positions, gameState, boardConfig);

  /* ---- Set the game control button events ---- */

  gameControlButtons.difficulty.dataset.difficulty =
    config["defaultDifficulty"];
  gameControlButtons.difficulty.textContent = getTextForDifficultyButton(
    config["defaultDifficulty"]
  );

  gameControlButtons.shuffle.addEventListener("click", () => {
    events.clickShuffle(positions, gameState, boardConfig);
  });

  gameControlButtons.newGame.addEventListener("click", async () => {
    events.clickNewGame(
      gameControlButtons,
      gameState,
      supabaseClient,
      groups,
      positions,
      boardConfig
    );
  });

  gameControlButtons.deselect.addEventListener("click", () => {
    events.clickDeselect(gameState.activeTiles);
  });

  gameControlButtons.submit.addEventListener("click", () => {
    events.clickSubmit(
      gameState,
      groups,
      positions,
      boardConfig,
      gameControlButtons
    );
  });

  gameControlButtons.solve.addEventListener("click", async () => {
    await events.clickSolve(
      gameState,
      groups,
      positions,
      boardConfig,
      gameControlButtons
    );
  });

  gameControlButtons.difficulty.addEventListener("click", (event) => {
    events.clickDifficulty(event);
    gameControlButtons.newGame.click();
  });

  /* ---- Set the game's apply settings button events ---- */

  const applyButton = document.getElementById("apply-button");

  applyButton.addEventListener("click", () => {
    events.clickApply(
      settingsPanel,
      blurOverlay,
      positions,
      gameState,
      boardConfig
    );
  });
})();
