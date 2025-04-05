/**
 * @file gameUI.js
 * @description This file contains the functions to draw the game board and the game UI elements.
 */

import { gameTheme, solutionTheme } from "../config/theme.json";
import { gameCanvas, solutionCanvas } from "../config/canvasConfig.json";

/**
 * Set the canvas DPI (dots per inch) for high-resolution displays.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {number} width Width of the canvas in pixels.
 * @param {number} height Height of the canvas in pixels.
 * @param {number} dpi DPI (dots per inch) for high-resolution displays (default: window.devicePixelRatio).
 */
export function setCanvasDPI(
  canvas,
  width,
  height,
  dpi = window.devicePixelRatio
) {
  const scaledWidth = width * dpi;
  const scaledHeight = height * dpi;

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

/**
 * Draw the board.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {Array} words array of riddle-word pairs for the board.
 * @param {Array} tiles 2D array of tile states.
 * @param {Set} selectedTiles array of selected tiles.
 * @param {Boolean} debug whether to show debug information (default: false).
 */
export function drawBoard(canvas, tiles, selectedTiles, debug = false) {
  // Get the game canvas configuration and calculate the tile size

  const boardTheme = gameTheme["board"];

  const rows = gameCanvas["rows"];
  const cols = gameCanvas["cols"];

  const tileWidth =
    (canvas.width -
      (cols - 1) * boardTheme["padding"] -
      2 * boardTheme["margin"]) /
    cols;
  const tileHeight =
    (canvas.height -
      (rows - 1) * boardTheme["padding"] -
      2 * boardTheme["margin"]) /
    rows;

  const ctx = canvas.getContext("2d");

  // Clear the canvas and draw the board background

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the tiles

  const tilesTheme = gameTheme["tiles"];
  const tileColors = tilesTheme["color"];
  const textTheme = tilesTheme["text"];

  let tileIndex = 0;

  for (let row = 0; row < rows && tileIndex < tiles.length; row++) {
    for (
      let col = 0;
      col < cols && tileIndex < tiles.length;
      col++, tileIndex++
    ) {
      const x =
        col * tileWidth + col * boardTheme["padding"] + boardTheme["margin"];
      const y =
        row * tileHeight + row * boardTheme["padding"] + boardTheme["margin"];

      // Draw the tile border
      ctx.strokeStyle = tilesTheme["borderColor"];
      ctx.lineWidth = tilesTheme["borderWidth"];
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      const tile = tiles[tileIndex];

      // Set the fill color based on the tile state
      const color = tile.completed
        ? tileColors["completed"]
        : selectedTiles.has(tile)
        ? tileColors["selected"]
        : tileColors["default"];

      ctx.fillStyle = color;

      ctx.fillRect(x, y, tileWidth, tileHeight);

      // Draw the tile text
      ctx.fillStyle = textTheme["color"];
      ctx.font = textTheme["fontSize"] + "px " + textTheme["fontFamily"];
      ctx.textAlign = textTheme["align"];
      ctx.textBaseline = textTheme["baseline"];

      if (debug) {
        ctx.fillText(
          tile.word + ` (${tile.group})`,
          x + tileWidth / 2,
          y + tileHeight / 2
        );
      } else {
        ctx.fillText(tile.word, x + tileWidth / 2, y + tileHeight / 2);
      }
    }
  }
}

/**
 * Draw on the solution board.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {Map<number, Array>} completedGroups array of completed groups.
 * @param {Boolean} debug whether to show debug information (default: false).
 */
export function drawSolution(canvas, completedGroups, debug = false) {
  /* Get the game canvas configuration and calculate the tile size */

  const boardTheme = solutionTheme["board"];

  const groups = solutionCanvas["groups"];

  const maxTileInARow = Math.max(...groups);

  // The longest line has nargin on both sides,
  // plus maxTileInRow tiles and (maxTileInRow - 1) paddings.

  const margin = boardTheme["margin"];
  const padding = boardTheme["padding"];

  const tileWidth =
    (canvas.width - (2 * margin + (maxTileInARow - 1) * padding)) /
    maxTileInARow;

  // Same logit for height, but with the number of groups

  const tileHeight =
    (canvas.height - (2 * margin + (groups.length - 1) * padding)) /
    groups.length;

  const ctx = canvas.getContext("2d");

  // Clear the canvas and draw the board background

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Draw the tiles */

  const tilesTheme = solutionTheme["tiles"];
  const tileColors = tilesTheme["color"];
  const textTheme = tilesTheme["text"];

  for (let row = 0; row < groups.length; row++) {
    const group = groups[row];
    const riddles = completedGroups.get(group);

    for (let col = 0; col < group; col++) {
      // A row with T tiles has T tiles ans (T - 1) paddings and some margin
      const x =
        (canvas.width - (group * tileWidth + (group - 1) * padding)) / 2 +
        col * tileWidth +
        col * padding;

      const y = margin + row * tileHeight + row * padding;

      // Draw the tile border
      ctx.strokeStyle = tilesTheme["borderColor"];
      ctx.lineWidth = tilesTheme["borderWidth"];
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      if (riddles) {
        const tile = riddles[col];

        // Set the fill color based on the tile state
        const color = tile.completed
          ? tileColors["completed"][group - 2]
          : tileColors["default"];

        ctx.fillStyle = color;

        ctx.fillRect(x, y, tileWidth, tileHeight);

        // Draw the tile text
        ctx.fillStyle = textTheme["color"];
        ctx.font = textTheme["fontSize"] + "px " + textTheme["fontFamily"];
        ctx.textAlign = textTheme["align"];
        ctx.textBaseline = textTheme["baseline"];

        if (debug) {
          ctx.fillText(
            tile.word + ` (${tile.group})`,
            x + tileWidth / 2,
            y + tileHeight / 2
          );
        } else {
          ctx.fillText(tile.word, x + tileWidth / 2, y + tileHeight / 2);
        }
      }
    }
  }
}
