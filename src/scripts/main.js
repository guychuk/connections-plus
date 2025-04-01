import { drawBoard, getTilesForANewGame, WORDS_IN_RIDDLE } from "./game.js";
import { shuffleArray } from "./utils.js";

const DEBUG = false;

// Get the canvas and change its size
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const setCanvasDPI = (canvas, width, height, dpi = window.devicePixelRatio) => {
  const scaledWidth = width * dpi;
  const scaledHeight = height * dpi;

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const canvasWidth = 800,
  canvasHeight = 600;

setCanvasDPI(canvas, canvasWidth, canvasHeight);

const rows = 4,
  cols = 5;

if (rows * cols != (WORDS_IN_RIDDLE * (WORDS_IN_RIDDLE + 1)) / 2 - 1) {
  throw new Error("rows/cols/groups don't match");
}

const completedGroups = Array.from(
  { length: WORDS_IN_RIDDLE - 1 },
  () => false
);

let maxGroupUncompleted = 6,
  minGroupUncompleted = 2;

// Divide the board into tiles

const tileWidth = canvas.width / cols,
  tileHeight = canvas.height / rows;

let selectedTiles = new Set();

let tiles = await getTilesForANewGame();

drawBoard(ctx, tiles, selectedTiles, rows, cols, tileWidth, tileHeight, DEBUG);

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio;

  const mouseX = (event.clientX - rect.left) * dpi;
  const mouseY = (event.clientY - rect.top) * dpi;

  const clickedCol = Math.floor(mouseX / tileWidth);
  const clickedRow = Math.floor(mouseY / tileHeight);

  const i = clickedRow * cols + clickedCol;

  if (selectedTiles.has(tiles[i])) {
    selectedTiles.delete(tiles[i]);
  } else if (!tiles[i].completed) {
    if (selectedTiles.size == maxGroupUncompleted) {
      console.log(`cannot choose more than ${maxGroupUncompleted} tiles`);
    } else {
      selectedTiles.add(tiles[i]);
    }
  }

  drawBoard(
    ctx,
    tiles,
    selectedTiles,
    rows,
    cols,
    tileWidth,
    tileHeight,
    DEBUG
  );
});

let won = false;

const submitButton = document.getElementById("submit-button");

submitButton.addEventListener("click", () => {
  const numOfSelections = selectedTiles.size;

  if (numOfSelections < minGroupUncompleted) {
    console.error("not enogh selected");
  } else if (completedGroups[numOfSelections - 1]) {
    console.error("you alredy solved this group size");
  } else {
    // Count the number of tiles which their group size is the same as the selected number of tiles
    let counter = 0;

    for (const tile of selectedTiles) {
      if (tile.groupSize === numOfSelections) {
        counter++;
      }
    }

    // Correct!
    if (counter == numOfSelections) {
      console.log("correct!");

      for (const tile of selectedTiles) {
        tile.completed = true;
      }

      selectedTiles.clear();

      completedGroups[numOfSelections - 1] = true;

      // The user won!
      if (minGroupUncompleted === maxGroupUncompleted) {
        console.log("WINNER!");
        won = true;
      } else if (numOfSelections == minGroupUncompleted) {
        for (let i = numOfSelections; i < completedGroups.length; i++) {
          if (!completedGroups[i]) {
            minGroupUncompleted = i + 1;
            break;
          }
        }
      } else if (numOfSelections == maxGroupUncompleted) {
        for (let i = numOfSelections - 1; i >= 0; i--) {
          if (!completedGroups[i]) {
            maxGroupUncompleted = i + 1;
            break;
          }
        }
      }

      drawBoard(
        ctx,
        tiles,
        selectedTiles,
        rows,
        cols,
        tileWidth,
        tileHeight,
        DEBUG
      );
    } else if (2 * counter >= numOfSelections) {
      console.log(`incorrect: ${counter}/${numOfSelections}`);
    } else {
      console.log(`incorrect`);
    }
  }
});

const resetButton = document.getElementById("reset-button");

resetButton.addEventListener("click", () => {
  selectedTiles.clear();
  drawBoard(
    ctx,
    tiles,
    selectedTiles,
    rows,
    cols,
    tileWidth,
    tileHeight,
    DEBUG
  );
});

const shuffleButton = document.getElementById("shuffle-button");

shuffleButton.addEventListener("click", () => {
  if (!won) {
    shuffleArray(tiles);
    drawBoard(
      ctx,
      tiles,
      selectedTiles,
      rows,
      cols,
      tileWidth,
      tileHeight,
      DEBUG
    );
  }
});

const newGameButton = document.getElementById("new-game-button");

newGameButton.addEventListener("click", async () => {
  selectedTiles.clear();

  tiles = await getTilesForANewGame();

  won = false;

  drawBoard(
    ctx,
    tiles,
    selectedTiles,
    rows,
    cols,
    tileWidth,
    tileHeight,
    DEBUG
  );
});
