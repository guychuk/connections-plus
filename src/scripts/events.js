/**
 * @file events.js
 * @description This file contains the complex event handlers for the game.
 */

import { drawBoard, getGameTileIndex } from "./gameUI.js";
import { selectTile } from "./gameLogic.js";

/**
 * Handles the click event on the canvas.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {Object} tileSize - The size of each tile.
 * @param {Array} tiles - The tiles set.
 * @param {Set} selectedTiles - The set of selected tiles.
 * @param {number} hoveredTile - The index of the hovered tile or -1 if none.
 * @param {Boolean} debug - The debug flag (default: false).
 */
export function tapOnTile(
  event,
  canvas,
  tileSize,
  tiles,
  selectedTiles,
  hoveredTile,
  debug = false
) {
  // Calculate the mouse position in the canvas and the tile size

  const tileIndex = getGameTileIndex(event, canvas, tileSize);

  if (tileIndex !== -1) {
    // Select the tile and redraw the board

    selectTile(tileIndex, tiles, selectedTiles, debug);

    drawBoard(canvas, tileSize, tiles, selectedTiles, hoveredTile, debug);
  }
}
