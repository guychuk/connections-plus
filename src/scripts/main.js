import { createClient } from "@supabase/supabase-js";

// Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch riddles from the DB.
 * @param {number} num umber of riddles to fetch.
 * @returns an array of num riddles.
 */
async function fetchRiddles(num) {
  const { data: riddles, error } = await supabase
    .from("random_riddles")
    .select("*")
    .limit(num);

  if (error) {
    console.error("error fetching riddles:", error);
    return [];
  }

  console.log(`Fetched ${riddles.length} riddles`);

  return riddles;
}

// Get the canvas and change its size
const canvas = document.getElementById("game-canvas");
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext("2d");

const rows = 4;
const cols = 5;
const WORDS_IN_RIDDLE = 6;

if (rows * cols != (WORDS_IN_RIDDLE * (WORDS_IN_RIDDLE + 1)) / 2 - 1) {
  throw new Error("rows/cols/groups don't match");
}

const completedGroups = Array.from({ length: WORDS_IN_RIDDLE }, () => false);

let maxGroupUncompleted = 6;

// Divide the board into tiles

const tileWidth = canvas.width / cols;
const tileHeight = canvas.height / rows;

const tiles = Array.from({ length: rows }, () =>
  Array.from({ length: cols }, () => false)
);

let selectedTiles = 0;

/**
 * Draw the board.
 * @param words array of riddle-word pairs for the board.
 */
function drawBoard(words) {
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

/**
 * Get k random distinct numbers in [1, n].
 * @param {number} n number of options.
 * @param {number} k number of choices (0 <= k <= n) [pass -1 for k=n which is the default].
 * @returns an array with k random choices from [1, n].
 */
function getRandomNums(n, k = -1) {
  let options = Array.from({ length: n }, (_, index) => index + 1);
  let chosen = 0;

  if (k < 0) {
    k = n;
  }

  while (chosen < k) {
    // Choose a random index
    const index = Math.floor(Math.random() * (n - chosen)) + chosen;

    // Swap the values
    [options[chosen], options[index]] = [options[index], options[chosen]];

    // Save the choice
    chosen++;
  }

  return options.slice(0, k);
}

/**
 *
 * @param {array} array
 */
function shuffleArray(array) {
  const perm = getRandomNums(array.length);

  for (let i = 0; i < array.length; i++) {
    [array[i], array[perm[i] - 1]] = [array[perm[i] - 1], array[i]];
  }
}

/**
 * Get words from fetched riddles.
 * @param riddles
 * @returns array of riddle-word pairs for the board.
 */
function getWords(riddles) {
  let words = [];

  riddles.forEach((riddle, index) => {
    // 2, 3, ..., 6
    const indices = getRandomNums(WORDS_IN_RIDDLE, index + 2);

    indices.forEach((i) => {
      words.push({ riddle: riddle["riddle"], word: riddle[`word_${i}`] });
    });
  });

  return words;
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const clickedCol = Math.floor(mouseX / tileWidth);
  const clickedRow = Math.floor(mouseY / tileHeight);

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

const riddles = await fetchRiddles(WORDS_IN_RIDDLE - 1);

const words = getWords(riddles);

shuffleArray(words);

drawBoard(words);
