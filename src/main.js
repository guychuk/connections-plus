import { calculateTileSize, getPositionOnCanvas } from "./ui";
import { containsDulpicates, shuffleArray } from "./utils";
import config from "./config.json";
import { createClient } from "@supabase/supabase-js";
import { fetchRiddles } from "./supabase";

// Supabase connection
const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_KEY;

console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Key:", SUPABASE_KEY);

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const riddles = null;

(async () => {
  riddles = await fetchRiddles(supabaseClient, 10, true);
  console.log("Riddles fetched:", riddles);
})();

// Set the theme togggle button functionality
// and the initial text based on the current theme

const themeToggleButton = document.getElementById("theme-toggle-button");
themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});

// Read game configuration

/** Number of tiles in each group */
const GROUPS = config["groups"];
GROUPS.sort();

if (containsDulpicates(GROUPS)) {
  throw new Error("Groups contain duplicates");
} else {
  const groupsParagraph = document.getElementById("subtitle");
  groupsParagraph.textContent = `Group Sizes are ${GROUPS.join(", ")}`;
}

const NUM_TILES = GROUPS.reduce((acc, group) => acc + group, 0);
const BOARD_ROWS = GROUPS.length;
const BOARD_COLS = GROUPS[GROUPS.length - 1]; // The last group is the largest

/** Gap in pixels between tiles */
const HORIZONTAL_GAP = 10;
const VERTICAL_GAP = 10;

// Populate the board with tiles

const board = document.getElementById("board");

const tileSize = calculateTileSize(
  board,
  BOARD_ROWS,
  BOARD_COLS,
  HORIZONTAL_GAP,
  VERTICAL_GAP
);

// Create a 2D array of positions for the tiles
// Always position the buttons in the first NUM_TILES positions

const positions = Array.from({ length: BOARD_ROWS }, (_, row) =>
  Array.from({ length: BOARD_COLS }, (_, col) => {
    return {
      row,
      col,
    };
  })
).flat();

// Create the buttons and position them on the board

shuffleArray(positions);

for (let i = 0; i < NUM_TILES; i++) {
  const button = document.createElement("button");
  const { x, y } = getPositionOnCanvas(
    positions[i],
    tileSize,
    HORIZONTAL_GAP,
    VERTICAL_GAP
  );

  button.classList.add("tile");
  button.style.width = `${tileSize.width}px`;
  button.style.height = `${tileSize.height}px`;
  button.textContent = i + 1;
  button.style.position = "absolute";
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;

  board.appendChild(button);
}

// Add the shuffle button functionality

const shuffleButton = document.getElementById("shuffle-button");

shuffleButton.addEventListener("click", () => {
  const buttons = Array.from(document.querySelectorAll(".tile"));

  shuffleArray(positions);

  buttons.forEach((button, i) => {
    const { x, y } = getPositionOnCanvas(
      positions[i],
      tileSize,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
  });
});
