import { shuffleArray, hashTilesSet, makePositions } from "./utils.js";
import Toastify from "toastify-js";

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

const getPositionOnCanvasCentered = (
  pos,
  group,
  largestGroup,
  tileSize,
  hgap,
  vgap
) => {
  const { x, y } = getPositionOnCanvas(pos, tileSize, hgap, vgap);
  return {
    x: x + ((tileSize.width + hgap) * (largestGroup - group)) / 2,
    y,
  };
};

/**
 * Shuffles the positions of the tiles on the board.
 * @param {Set} tiles - A set of tile objects.
 * @param {Array} positions - An array of positions to shuffle.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 */
export const shuffleBoard = (tiles, positions, tileSize, hgap, vgap) => {
  shuffleArray(positions);

  let i = 0;

  for (let tile of tiles) {
    const { x, y } = getPositionOnCanvas(positions[i], tileSize, hgap, vgap);

    tile.button.style.left = `${x}px`;
    tile.button.style.top = `${y}px`;
    i++;
  }
};

/**
 * Creates buttons for the tiles and positions them on the board.
 * @param {HTMLCanvasElement} board - The board element containing the tiles.
 * @param {Array} positions - An array of positions for the tiles.
 * @param {Set} tiles - A set of tile objects.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 * @param {Set} selectedTiles - A set of selected tiles.
 * @param {number} maxSelections - The maximum number of tiles that can be selected.
 * @returns {Array} - An array of button elements.
 */
export const createButtons = (
  board,
  positions,
  tiles,
  tileSize,
  hgap,
  vgap,
  selectedTiles,
  maxSelections
) => {
  const buttons = [];
  let i = 0;

  for (const tile of tiles) {
    const button = document.createElement("button");
    const { x, y } = getPositionOnCanvas(positions[i++], tileSize, hgap, vgap);

    button.classList.add("tile");
    button.style.width = `${tileSize.width}px`;
    button.style.height = `${tileSize.height}px`;
    button.textContent = tile.term + " " + tile.groupSize;
    button.style.position = "absolute";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    tile.button = button;

    button.addEventListener("click", () => {
      if (selectedTiles.has(tile)) {
        button.classList.remove("selected");
        selectedTiles.delete(tile);
      } else if (selectedTiles.size < maxSelections) {
        button.classList.add("selected");
        selectedTiles.add(tile);
      }
    });

    buttons.push(button);
    board.appendChild(button);
  }

  return buttons;
};

/**
 * Creates a Toastify message.
 * @param {Array} classes - An array of classes to apply to the Toastify message.
 * @param {string} text - The text to display in the Toastify message.
 * @param {number} duration - The time the toast is on the screen in ms.
 * @returns {Object} - A Toastify message object.
 */
export const makeToast = (classes, text, duration = 2000) => {
  const classesString = classes.join(" ");

  return Toastify({
    text: text,
    duration: duration,
    gravity: "top",
    position: "left",
    stopOnFocus: true,
    className: classesString,
  });
};

/**
 * Creates a Toastify message for submitting a set of tiles.
 * @param {Set} selectedTiles - The set of currently selected tiles.
 * @param {Set} previousSubmissions - The set of previously submitted tiles.
 * @param {Array} groups - An array of group sizes in the game, sorted.
 * @returns {Object} - A Toastify message object and the newly completed group.
 */
export const submitToast = (selectedTiles, previousSubmissions, groups) => {
  const group = selectedTiles.size;

  let toast = null;

  let newlyCompletedGroup = null;

  if (group < groups[0]) {
    toast = makeToast(
      ["toastify-rounded", "toastify-invalid-choice"],
      `🚫 You need to select at least ${groups[0]} tiles to submit`
    );
  } else if (group > groups[groups.length - 1]) {
    toast = makeToast(
      ["toastify-rounded", "toastify-invalid-choice"],
      `🚫 You need to select at most ${
        groups[groups.length - 1]
      } tiles to submit`
    );
  } else {
    const selectedTilesHashed = hashTilesSet(selectedTiles);

    if (previousSubmissions.has(selectedTilesHashed)) {
      toast = makeToast(
        ["toastify-rounded", "toastify-duplicate"],
        `🚫 You already submitted that`
      );
    } else {
      previousSubmissions.add(selectedTilesHashed);

      const correctTiles = Array.from(selectedTiles).reduce(
        (acc, tile) => (tile.groupSize === group ? acc + 1 : acc),
        0
      );

      if (correctTiles === group) {
        newlyCompletedGroup = [...selectedTiles];
        toast = makeToast(
          ["toastify-rounded", "toastify-correct"],
          `🎉 You got it!`
        );
      } else if (2 * correctTiles >= group) {
        // ? Maybe give other info (largest group of common categoty, or something else)
        toast = makeToast(
          ["toastify-rounded", "toastify-partial"],
          `🚀 ${correctTiles} out of ${group} correct!`
        );
      } else {
        toast = makeToast(
          ["toastify-rounded", "toastify-incorrect"],
          `❌ That's not it...`
        );
      }
    }
  }

  return { toast, newlyCompletedGroup };
};

/**
 * Redraws the board.
 * @param {Set} remainngTiles - The set of remaining tiles.
 * @param {Array} completedGroups - An array of completed groups.
 * @param {Array} groups - An array of group sizes in the game, sorted.
 * @param {Array} positions - An array of positions for the tiles.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 */
export const redrawBoard = (
  remainngTiles,
  completedGroups,
  groups,
  positions,
  tileSize,
  hgap,
  vgap
) => {
  // Move the completed ones down

  const rows = completedGroups.length;
  const cols = groups[groups.length - 1];
  let row = rows - 1;

  for (let i = rows - 1; i >= 0; i--) {
    const group = completedGroups[i].length;

    if (group > 0) {
      for (let col = 0; col < group; col++) {
        const { x, y } = getPositionOnCanvasCentered(
          { row, col },
          group,
          cols,
          tileSize,
          hgap,
          vgap
        );

        completedGroups[i][col].button.style.left = `${x}px`;
        completedGroups[i][col].button.style.top = `${y}px`;
      }

      row--;
    }
  }

  // Now draw the rest
  shuffleBoard(remainngTiles, positions, tileSize, hgap, vgap);
};
