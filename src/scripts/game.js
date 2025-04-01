import { getRandomNums } from "./utils.js";
import { shuffleArray } from "./utils.js";

/**
 * Draw the board.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Array} words array of riddle-word pairs for the board.
 * @param {Array} tiles 2D array of tile states.
 * @param {number} tileWidth Width of each tile.
 * @param {number} tileHeight Height of each tile.
 */
export function drawBoard(ctx, tiles, tileWidth, tileHeight) {
  const rows = tiles.length,
    cols = tiles[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth;
      const y = row * tileHeight;

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      ctx.fillStyle = tiles[row][col].selected ? "yellow" : "lightblue";
      ctx.fillRect(x, y, tileWidth, tileHeight);

      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(tiles[row][col].word, x + 10, y + 30);
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
  const wordsInRiddle = Object.keys(riddles[0]).length - 2; // exclude ID and riddle

  riddles.forEach((riddle, index) => {
    // 2, 3, ..., 6
    const indices = getRandomNums(wordsInRiddle, index + 2);

    indices.forEach((i) => {
      words.push({ riddle: riddle["riddle"], word: riddle[`word_${i}`] });
    });
  });

  if (shuffle) {
    shuffleArray(words);
  }

  return words;
}
