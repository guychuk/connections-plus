import { shuffleArray } from "./utils.js";

/**
 * Calculates the tile size based on the canvas size and the number of rows and columns.
 * @param {HTMLCanvasElement} canvas
 * @param {number} rows - Number of rows in the grid.
 * @param {number} cols - Number of columns in the grid.
 * @param {number} hgap - Horizontal gap between tiles.
 * @param {number} vgap - Vertical gap between tiles.
 * @returns {Object} - An object containing the tile height and width.
 */
export const calculateTileSize = (canvas, rows, cols, hgap, vgap) => {
  const boardWidth = canvas.clientWidth;
  const boardHeight = canvas.clientHeight;

  const vgaps = vgap * (rows - 1);
  const hgaps = hgap * (cols - 1);

  const tileHeight = Math.floor((boardHeight - vgaps) / rows);
  const tileWidth = Math.floor((boardWidth - hgaps) / cols);

  return {
    height: tileHeight,
    width: tileWidth,
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices.
 * @param {Object} pos - An object containing the row and column indices of the tile.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - Horizontal gap between tiles.
 * @param {number} vgap - Vertical gap between tiles.
 * @returns {Object} - An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvas = (pos, tileSize, hgap, vgap) => {
  const x = pos.col * (tileSize.width + hgap);
  const y = pos.row * (tileSize.height + vgap);
  return {
    x,
    y,
  };
};

/**
 * Shuffles the positions of the tiles on the board.
 * @param {HTMLCanvasElement} board - The board element containing the tiles.
 * @param {Array} positions - An array of positions to shuffle.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 */
export const shuffleBoard = (board, positions, tileSize, hgap, vgap) => {
  const buttons = Array.from(board.children);

  shuffleArray(positions);

  buttons.forEach((button, i) => {
    const { x, y } = getPositionOnCanvas(positions[i], tileSize, hgap, vgap);

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
  });
};

/**
 * Creates buttons for the tiles and positions them on the board.
 * @param {HTMLCanvasElement} board - The board element containing the tiles.
 * @param {Array} positions - An array of positions for the tiles.
 * @param {Array} tiles - An array of tile objects.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 * @param {Object} selectedTilesObj - An object containing the selected buttons set and the maximum number of selected buttons.
 */
export const createButtons = (
  board,
  positions,
  tiles,
  tileSize,
  hgap,
  vgap,
  selectedTilesObj
) => {
  const { selectedTiles, maxSelections } = selectedTilesObj;

  for (let i = 0; i < tiles.length; i++) {
    const button = document.createElement("button");
    const { x, y } = getPositionOnCanvas(positions[i], tileSize, hgap, vgap);

    button.classList.add("tile");
    button.style.width = `${tileSize.width}px`;
    button.style.height = `${tileSize.height}px`;
    button.textContent = tiles[i].term;
    button.style.position = "absolute";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    tiles[i].button = button;

    button.addEventListener("click", () => {
      if (selectedTiles.has(button)) {
        button.classList.remove("selected");
        selectedTiles.delete(tiles[i]);
      } else if (selectedTiles.size < maxSelections) {
        button.classList.add("selected");
        selectedTiles.add(tiles[i]);
      }
    });

    board.appendChild(button);
  }
};
