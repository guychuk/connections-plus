// Get the canvas and change its size
const canvas = document.getElementById("game-canvas");
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext("2d");

const rows = 4;
const cols = 5;
const groups = 6;

const completedGroups = Array.from({ length: groups }, () => false);

let maxGroupUncompleted = 6;

// Divide the board into tiles

const tileWidth = canvas.width / cols;
const tileHeight = canvas.height / rows;

const tiles = Array.from({ length: rows }, () =>
  Array.from({ length: cols }, () => false)
);

let selectedTiles = 0;

function drawBoard() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth;
      const y = row * tileHeight;

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      ctx.fillStyle = tiles[row][col] ? "yellow" : "lightblue";
      ctx.fillRect(x, y, tileWidth, tileHeight);
    }
  }
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const clickedCol = Math.floor(mouseX / tileWidth);
  const clickedRow = Math.floor(mouseY / tileHeight);

  console.log(`clicked tile (${clickedRow}, ${clickedCol})`);

  if (tiles[clickedRow][clickedCol]) {
    tiles[clickedRow][clickedCol] = false;
    selectedTiles--;
  } else {
    if (selectedTiles == maxGroupUncompleted) {
      console.log(`cannot choose more than ${maxGroupUncompleted} tiles`);
    } else {
      tiles[clickedRow][clickedCol] = true;
      selectedTiles++;
    }
  }

  drawBoard();
});

drawBoard();
