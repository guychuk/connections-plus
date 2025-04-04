/**
 * @file main.js
 * @description Main entry point for the game. It sets up the game canvas, handles user interactions, and manages the game state.
 * @author guychuk
 */

import { drawBoard, setCanvasDPI } from "./gameUI.js";
import { shuffleArray } from "./utils.js";
import { tapOnTile } from "./events.js";
import { gameCanvas } from "../config/canvasConfig.json";
import {
  checkSelection,
  newGame,
  assertGameConfig,
  getTilesForANewGame,
} from "./gameLogic.js";

const DEBUG = true;

/* Set up the game canvas */

const canvas = document.getElementById("game-canvas");

setCanvasDPI(canvas, gameCanvas["width"], gameCanvas["height"]);

assertGameConfig();

/* Set up the game */

// Game variables

const completedGroups = new Set();
const selectedTiles = new Set();
const prevSelections = new Set();

let gameIsOver = false;
let tiles = await getTilesForANewGame();

/* Draw the board */

drawBoard(canvas, tiles, selectedTiles, DEBUG);

canvas.addEventListener("click", (event) => {
  if (!gameIsOver) {
    tapOnTile(event, canvas, tiles, selectedTiles, DEBUG);
  }
});

/* Button events */

const submitButton = document.getElementById("submit-button");
const deselectButton = document.getElementById("deselect-button");
const shuffleButton = document.getElementById("shuffle-button");
const newGameButton = document.getElementById("new-game-button");

submitButton.addEventListener("click", () => {
  gameIsOver = checkSelection(
    selectedTiles,
    completedGroups,
    prevSelections,
    DEBUG
  );

  if (gameIsOver) {
    submitButton.disabled = true;
    shuffleButton.disabled = true;
    deselectButton.disabled = true;
  }

  drawBoard(canvas, tiles, selectedTiles, DEBUG);
});

deselectButton.addEventListener("click", () => {
  selectedTiles.clear();

  drawBoard(canvas, tiles, selectedTiles, DEBUG);
});

shuffleButton.addEventListener("click", () => {
  shuffleArray(tiles);

  drawBoard(canvas, tiles, selectedTiles, DEBUG);
});

newGameButton.addEventListener("click", async () => {
  tiles = await newGame(selectedTiles, prevSelections, completedGroups);

  gameIsOver = false;
  submitButton.disabled = false;
  shuffleButton.disabled = false;
  deselectButton.disabled = false;

  drawBoard(canvas, tiles, selectedTiles, DEBUG);
});
