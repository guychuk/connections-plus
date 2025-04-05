/**
 * @file main.js
 * @description Main entry point for the game. It sets up the game canvas, handles user interactions, and manages the game state.
 * @author guychuk
 */

import {
  drawBoard,
  setCanvasDPI,
  drawSolution,
  getGameTileIndex,
  calculateTileSize,
} from "./gameUI.js";
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

const completedGroups = new Map();
const selectedTiles = new Set();
const prevSelections = new Set();

const gameTileSize = calculateTileSize(gameCanvas, "game");
const solutionTileSize = calculateTileSize(solutionCanvas, "solution");

let hoveredTile = -1;
let gameIsOver = false;
let tiles = await getTilesForANewGame();

/* Draw the board */

drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);

drawSolution(solutionCanvas, solutionTileSize, completedGroups, DEBUG);

gameCanvas.addEventListener("click", (event) => {
  if (!gameIsOver) {
    tapOnTile(
      event,
      gameCanvas,
      gameTileSize,
      tiles,
      selectedTiles,
      hoveredTile,
      DEBUG
    );
  }
});

gameCanvas.addEventListener("mousemove", (event) => {
  const hoveredTile = getGameTileIndex(event, gameCanvas, gameTileSize);

  drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);
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

  drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);
  drawSolution(solutionCanvas, solutionTileSize, completedGroups, DEBUG);
});

deselectButton.addEventListener("click", () => {
  selectedTiles.clear();

  drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);
});

shuffleButton.addEventListener("click", () => {
  shuffleArray(tiles);

  drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);
});

newGameButton.addEventListener("click", async () => {
  tiles = await newGame(selectedTiles, prevSelections, completedGroups);

  gameIsOver = false;
  hoveredTile = -1;

  submitButton.disabled = false;
  shuffleButton.disabled = false;
  deselectButton.disabled = false;

  drawBoard(gameCanvas, gameTileSize, tiles, selectedTiles, hoveredTile, DEBUG);
  drawSolution(solutionCanvas, solutionTileSize, completedGroups, DEBUG);
});
