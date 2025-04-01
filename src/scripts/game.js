import { getRandomNums, shuffleArray } from "./utils.js";
import { fetchRiddles } from "./supabase.js";
import { groupColors, font } from "../config/theme.json";

export const WORDS_IN_RIDDLE = 6;

/**
 * Draw the board.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Array} words array of riddle-word pairs for the board.
 * @param {Array} tiles 2D array of tile states.
 * @param {Set} selectedTiles array of selected tiles.
 * @param {number} rows number of rows.
 * @param {number} cols number of columns.
 * @param {number} tileWidth Width of each tile.
 * @param {number} tileHeight Height of each tile.
 */
export function drawBoard(
  ctx,
  tiles,
  selectedTiles,
  rows,
  cols,
  tileWidth,
  tileHeight,
  debug = false
) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth;
      const y = row * tileHeight;
      const i = row * cols + col;

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      if (i < tiles.length) {
        if (tiles[i].completed) {
          ctx.fillStyle = groupColors[tiles[i].groupSize - 2];
        } else {
          ctx.fillStyle = selectedTiles.has(tiles[i]) ? "yellow" : "lightblue";
        }
        ctx.fillRect(x, y, tileWidth, tileHeight);

        ctx.fillStyle = "black";
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(tiles[i].word, x + tileWidth / 2, y + tileHeight / 2);

        if (debug) {
          ctx.fillText(`group ${tiles[i].groupSize}`, x + 10, y + 30 + 30);
        }
      } else {
        ctx.fillStyle = "lightblue";
        ctx.fillRect(x, y, tileWidth, tileHeight);
      }
    }
  }
}

/**
 * Get words from fetched riddles.
 * @param {Array} riddles an array of fetched riddles.
 * @param {Boolean} shuffle whether to shuffle the returned array [defaults to true].
 * @returns array of riddle-word pairs for the board.
 */
export function chooseWords(riddles, shuffle = true) {
  let words = [];

  riddles.forEach((riddle, index) => {
    // 2, 3, ..., 6
    const indices = getRandomNums(WORDS_IN_RIDDLE, index + 2);

    indices.forEach((i) => {
      words.push({
        groupSize: index + 2,
        riddle: riddle["riddle"],
        word: riddle[`word_${i}`],
      });
    });
  });

  if (shuffle) {
    shuffleArray(words);
  }

  return words;
}

export async function getTilesForANewGame() {
  const riddles = await fetchRiddles(WORDS_IN_RIDDLE - 1);
  const tiles = chooseWords(riddles);

  return Array.from(tiles, (tile) => {
    tile.completed = false;
    return tile;
  });
}
