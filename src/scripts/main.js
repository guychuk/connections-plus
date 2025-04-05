/**
 * @file main.js
 * @description Main entry point for the game. It sets up the game canvas, handles user interactions, and manages the game state.
 * @author guychuk
 */

import { drawBoard, setCanvasDPI, drawSolution } from "./gameUI.js";
import { shuffleArray } from "./utils.js";
import { tapOnTile } from "./events.js";
import {
  gameCanvas as gameCanvasConfig,
  solutionCanvas as solutionCanvasConfig,
} from "../config/canvasConfig.json";
import {
  checkSelection,
  newGame,
  assertGameConfig,
  getTilesForANewGame,
} from "./gameLogic.js";

const DEBUG = true;

/* Set up the canvases */

const gameCanvas = document.getElementById("game-canvas");
const solutionCanvas = document.getElementById("solution-canvas");

setCanvasDPI(gameCanvas, gameCanvasConfig["width"], gameCanvasConfig["height"]);
setCanvasDPI(
  solutionCanvas,
  solutionCanvasConfig["width"],
  solutionCanvasConfig["height"]
);

assertGameConfig();

/* Set up the game */

// Game variables

const completedGroups = new Set();
const selectedTiles = new Set();
const prevSelections = new Set();

let gameIsOver = false;
let tiles = await getTilesForANewGame();

/* Draw the board */

drawBoard(gameCanvas, tiles, selectedTiles, DEBUG);

drawSolution(solutionCanvas, tiles, DEBUG);

gameCanvas.addEventListener("click", (event) => {
  if (!gameIsOver) {
    tapOnTile(event, gameCanvas, tiles, selectedTiles, DEBUG);
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

  drawBoard(gameCanvas, tiles, selectedTiles, DEBUG);
});

deselectButton.addEventListener("click", () => {
  selectedTiles.clear();

  drawBoard(gameCanvas, tiles, selectedTiles, DEBUG);
});

shuffleButton.addEventListener("click", () => {
  shuffleArray(tiles);

  drawBoard(gameCanvas, tiles, selectedTiles, DEBUG);
});

newGameButton.addEventListener("click", async () => {
  tiles = await newGame(selectedTiles, prevSelections, completedGroups);

  gameIsOver = false;
  submitButton.disabled = false;
  shuffleButton.disabled = false;
  deselectButton.disabled = false;

  drawBoard(gameCanvas, tiles, selectedTiles, DEBUG);
});
