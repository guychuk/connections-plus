import { fetchRiddles } from "./supabase.js";
import { drawBoard, chooseWords } from "./game.js";

// Get the canvas and change its size
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const setCanvasDPI = (
  canvas,
  ctx,
  width,
  height,
  dpi = window.devicePixelRatio
) => {
  const scaledWidth = width * dpi;
  const scaledHeight = height * dpi;

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const canvasWidth = 800,
  canvasHeight = 600;

setCanvasDPI(canvas, ctx, canvasWidth, canvasHeight);

const rows = 4,
  cols = 5;
const WORDS_IN_RIDDLE = 6;

if (rows * cols != (WORDS_IN_RIDDLE * (WORDS_IN_RIDDLE + 1)) / 2 - 1) {
  throw new Error("rows/cols/groups don't match");
}

const completedGroups = Array.from({ length: WORDS_IN_RIDDLE }, () => false);

let maxGroupUncompleted = 6;

// Divide the board into tiles

const tileWidth = canvas.width / cols,
  tileHeight = canvas.height / rows;

let selectedTiles = 0;

const riddles = await fetchRiddles(WORDS_IN_RIDDLE - 1);

const words = chooseWords(riddles);

const tiles = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: cols }, (_, col) => {
    const entry = words[row * cols + col];

    return { riddle: entry.riddle, word: entry.word, selected: false };
  })
);

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio;

  const mouseX = (event.clientX - rect.left) * dpi;
  const mouseY = (event.clientY - rect.top) * dpi;
 
  const clickedCol = Math.floor(mouseX / tileWidth);
  const clickedRow = Math.floor(mouseY / tileHeight);

  if (tiles[clickedRow][clickedCol].selected) {
    tiles[clickedRow][clickedCol].selected = false;
    selectedTiles--;
  } else {
    if (selectedTiles == maxGroupUncompleted) {
      console.log(`cannot choose more than ${maxGroupUncompleted} tiles`);
    } else {
      tiles[clickedRow][clickedCol].selected = true;
      selectedTiles++;
    }
  }

  drawBoard(ctx, tiles, tileWidth, tileHeight);
});

drawBoard(ctx, tiles, tileWidth, tileHeight);
