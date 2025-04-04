/**
 * @file events.js
 * @description This file contains the complex event handlers for the game.
 */

import { drawBoard } from "./gameUI.js";
import { gameCanvas } from "../config/canvasConfig.json";
import { selectTile } from "./gameLogic.js";

/**
 * Handles the click event on the canvas.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {Array} tiles - The tiles set.
 * @param {Set} selectedTiles - The set of selected tiles.
 * @param {Boolean} debug - The debug flag (default: false).
 */
export function tapOnTile(event, canvas, tiles, selectedTiles, debug = false) {
  // Calculate the mouse position in the canvas and the tile size

  const rect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio;

  const mouseX = (event.clientX - rect.left) * dpi;
  const mouseY = (event.clientY - rect.top) * dpi;

  const tileWidth = canvas.width / gameCanvas["cols"];
  const tileHeight = canvas.height / gameCanvas["rows"];

  // Calculate the clicked tile index

  const clickedCol = Math.floor(mouseX / tileWidth);
  const clickedRow = Math.floor(mouseY / tileHeight);
  const tileIndex = clickedRow * gameCanvas["cols"] + clickedCol;

  // Select the tile and redraw the board

  selectTile(tileIndex, tiles, selectedTiles, debug);

  drawBoard(canvas, tiles, selectedTiles, debug);
}
