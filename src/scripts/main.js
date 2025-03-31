import { createClient } from "@supabase/supabase-js";

// Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch words from DB
async function fetchWords(num) {
  const { data: words, error } = await supabase
    .from("words")
    .select("*")
    .limit(num);

  if (error) {
    console.error("error fetching words:", error);
    return [];
  }

  console.log(`Fetched ${words.length} words:`, words);
  return words;
}

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

async function drawBoard(words) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth;
      const y = row * tileHeight;

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      ctx.fillStyle = tiles[row][col] ? "yellow" : "lightblue";
      ctx.fillRect(x, y, tileWidth, tileHeight);

      const wordIndex = row * cols + col;

      if (words[wordIndex]) {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(words[wordIndex].word, x + 10, y + 30);
      }
    }
  }
}

async function insertWord(word) {
  const { error } = await supabase.from("words").insert([{ word }]);

  if (error) {
    console.error(`error inserting word:`, error);
  } else {
    console.log(`word "${word}" inserted successfully`);
  }
}

const words = await fetchWords(rows * cols);

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

  drawBoard(words);
});

// List of words to insert
// const wordsToInsert = [
//   "apple",
//   "banana",
//   "cherry",
//   "date",
//   "elderberry",
//   "fig",
//   "grape",
//   "honeydew",
//   "kiwi",
//   "lemon",
//   "mango",
//   "nectarine",
//   "orange",
//   "papaya",
//   "quince",
//   "raspberry",
//   "strawberry",
//   "tangerine",
//   "ugli",
//   "watermelon",
// ];

// for (const word of wordsToInsert) {
//   await insertWord(word);
// }

drawBoard(words);
