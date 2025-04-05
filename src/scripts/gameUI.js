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
 * Calculate the tile size based on the canvas size and the number of rows and columns.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @return {Object} Object containing the tile width and height.
 */
export function calculateGameTileSize(canvas) {
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

  return { tileWidth: tileWidth, tileHeight: tileHeight };
}

/**
 * Get the tile index based on the mouse click position.
 * @param {MouseEvent} event Mouse event containing the click position.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {Object} tileSize Object containing the tile width and height.
 * @return {number} Tile index calculated from the mouse position or -1 if out of bounds.
 */
export function getGameTileIndex(event, canvas, tileSize) {
  // Calculate the mouse position in the canvas and the tile size

  const rect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio;

  const mouseX = (event.clientX - rect.left) * dpi;
  const mouseY = (event.clientY - rect.top) * dpi;

  // Calculate the clicked tile index

  const margin = gameTheme["board"]["margin"];
  const tileWidth = tileSize["tileWidth"];
  const tileHeight = tileSize["tileHeight"];
  const padding = gameTheme["board"]["padding"];

  // If the mouse is on a tile in column c, then
  // margin + c * (tileWidth + padding) <= mouseX < margin + c * (tileWidth + padding) + tileWidth

  const lowerBoundCol = (mouseX - margin - tileWidth) / (tileWidth + padding);
  const upperBoundCol = (mouseX - margin) / (tileWidth + padding);

  if (Math.ceil(lowerBoundCol) !== Math.floor(upperBoundCol)) {
    return -1; // Out of bounds
  }

  const clickedCol = Math.ceil(lowerBoundCol);

  // Same logic for the row

  const lowerBoundRow = (mouseY - margin - tileHeight) / (tileHeight + padding);
  const upperBoundRow = (mouseY - margin) / (tileHeight + padding);

  if (Math.ceil(lowerBoundRow) !== Math.floor(upperBoundRow)) {
    return -1; // Out of bounds
  }

  const clickedRow = Math.ceil(lowerBoundRow);

  return clickedRow * gameCanvas["cols"] + clickedCol;
}

/**
 * Draw the board.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {Object} tileSize Object containing the tile width and height.
 * @param {Array} tiles Array of tile objects.
 * @param {Set} selectedTiles Set of selected tiles.
 * @param {number} hoveredTile Index of the hovered tile or -1 if none.
 * @param {Boolean} debug Whether to show debug information (default: false).
 */
export function drawBoard(
  canvas,
  tileSize,
  tiles,
  selectedTiles,
  hoveredTile,
  debug = false
) {
  // Get the game canvas configuration and calculate the tile size

  const boardTheme = gameTheme["board"];

  const rows = gameCanvas["rows"];
  const cols = gameCanvas["cols"];

  const tileWidth = tileSize["tileWidth"];
  const tileHeight = tileSize["tileHeight"];

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
        : hoveredTile === tileIndex
        ? tileColors["hovered"]
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
