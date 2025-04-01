import { drawBoard, chooseWords, WORDS_IN_RIDDLE } from "./game.js";
import { fetchRiddles } from "./supabase.js";

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

const completedGroups = Array.from({ length: WORDS_IN_RIDDLE }, () => false);

let maxGroupUncompleted = 6;

// Divide the board into tiles

const tileWidth = canvas.width / cols,
  tileHeight = canvas.height / rows;

let selectedTiles = new Set();

const riddles = await fetchRiddles(WORDS_IN_RIDDLE - 1);
const tiles = chooseWords(riddles);

drawBoard(ctx, tiles, selectedTiles, rows, cols, tileWidth, tileHeight);

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
  } else {
    if (selectedTiles.size == maxGroupUncompleted) {
      console.log(`cannot choose more than ${maxGroupUncompleted} tiles`);
    } else {
      selectedTiles.add(tiles[i]);
    }
  }

  drawBoard(ctx, tiles, selectedTiles, rows, cols, tileWidth, tileHeight);
});

const submitButton = document.getElementById("submit-button");

submitButton.addEventListener("click", () => {
  console.log("submit");
});
