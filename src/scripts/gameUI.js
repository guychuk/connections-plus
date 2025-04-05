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
 * Calculate the tile size based on the canvas size.
 * @param {HTMLCanvasElement} canvas HTML canvas element.
 * @param {string} side Side of the board ("game" or "solution").
 * @return {Object} Object containing the tile width and height.
 */
export function calculateTileSize(canvas, side) {
  if (side !== "game" && side !== "solution") {
    throw new Error("Invalid side: " + side);
  }

  const canvasConfig = side === "solution" ? solutionCanvas : gameCanvas;

  const rows =
    side === "solution" ? canvasConfig["groups"].length : canvasConfig["rows"];

  const cols =
    side === "solution"
      ? Math.max(...canvasConfig["groups"])
      : canvasConfig["cols"];

  const margin = canvasConfig["margin"];

  const padding = canvasConfig["padding"];

  const tileWidth = (canvas.width - (2 * margin + (cols - 1) * padding)) / cols;

  const tileHeight =
    (canvas.height - (2 * margin + (rows - 1) * padding)) / rows;

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

  const margin = gameCanvas["margin"];
  const padding = gameCanvas["padding"];

  const tileWidth = tileSize["tileWidth"];
  const tileHeight = tileSize["tileHeight"];

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
  const ctx = canvas.getContext("2d");

  // Get the board layout

  const rows = gameCanvas["rows"];
  const cols = gameCanvas["cols"];

  const tileWidth = tileSize["tileWidth"];
  const tileHeight = tileSize["tileHeight"];

  const margin = gameCanvas["margin"];
  const padding = gameCanvas["padding"];

  // Get the board theme

  const tilesTheme = gameTheme["tiles"];
  const tileColors = tilesTheme["color"];
  const textTheme = tilesTheme["text"];

  // Functions to calculate the tile position and color

  const getX = (col) => col * (tileWidth + padding) + margin;
  const getY = (row) => row * (tileHeight + padding) + margin;

  const getColor = (tileIndex) =>
    tiles[tileIndex].completed
      ? tileColors["completed"]
      : selectedTiles.has(tiles[tileIndex])
      ? tileColors["selected"]
      : hoveredTile === tileIndex
      ? tileColors["hovered"]
      : tileColors["default"];

  // Clear the canvas and draw the board background

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the tiles

  let tileIndex = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++, tileIndex++) {
      const tile = tiles[tileIndex];

      const x = getX(col);
      const y = getY(row);
      const color = getColor(tileIndex);

      // Draw the tile border
      ctx.strokeStyle = tilesTheme["borderColor"];
      ctx.lineWidth = tilesTheme["borderWidth"];
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      // Set the fill color based on the tile state
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
export function drawSolution(canvas, tileSize, completedGroups, debug = false) {
  const ctx = canvas.getContext("2d");

  // Get the board layout

  const groups = solutionCanvas["groups"];
  const maxGroup = Math.max(...groups);

  const margin = solutionCanvas["margin"];
  const padding = solutionCanvas["padding"];

  const align = solutionCanvas["align"];

  const tileWidth = tileSize["tileWidth"];
  const tileHeight = tileSize["tileHeight"];

  // Get the board theme
  const tilesTheme = solutionTheme["tiles"];
  const tileColors = tilesTheme["color"];
  const textTheme = tilesTheme["text"];

  // Functions to calculate the tile position and color
  const getX = (col, group) => {
    if (align === "left") {
      return margin + col * (tileWidth + padding);
    } else if (align === "center") {
      return (
        margin +
        col * (tileWidth + padding) +
        ((maxGroup - group) * (tileWidth + padding)) / 2
      );
    } else {
      throw Error("align must be left or center");
    }
  };

  const getY = (row) => row * (tileHeight + padding) + margin;

  const getColor = (group) => tileColors["completed"][group - 2];

  // Clear the canvas and draw the board background

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the tiles

  for (let row = 0; row < groups.length; row++) {
    const group = groups[row];
    const riddleTiles = completedGroups.get(group);

    for (let col = 0; col < group; col++) {
      const x = getX(col, group);
      const y = getY(row);

      // Draw the tile border
      ctx.strokeStyle = tilesTheme["borderColor"];
      ctx.lineWidth = tilesTheme["borderWidth"];
      ctx.strokeRect(x, y, tileWidth, tileHeight);

      // The user already solved the riddle, so we can draw the tile
      if (riddleTiles) {
        const tile = riddleTiles[col];

        const color = getColor(group);

        // Set the fill color based on the group
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
