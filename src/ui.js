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
export const getPositionOnCanvas = (pos, tileSize, hgap, vgap) => {
  const x = pos.col * (tileSize.width + hgap);
  const y = pos.row * (tileSize.height + vgap);
  return {
    x,
    y,
  };
};
