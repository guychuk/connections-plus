import {
  shuffleArray,
  hashTilesSet,
  randomNum,
  assertNotNullOrUndefined,
} from "../core/utils.js";
import {
  TOAST_DUPLICATE,
  TOAST_CORRECT,
  TOAST_INCORRECT,
  TOAST_WINNER,
  TOAST_ERROR,
  makeTooFewToast,
  makeTooManyToast,
  makePartialToast,
} from "./toasts.js";
import confetti from "canvas-confetti";
import { confettiDuration } from "../config/config.json";

/* ------------------------
    TILE POSITION & SIZE
  ------------------------ */

/**
 * Calculates the tile size based on the canvas size and the number of rows and columns.
 * @param {HTMLCanvasElement} canvas The canvas element.
 * @param {number} rows Number of rows in the grid.
 * @param {number} cols Number of columns in the grid.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @returns {Object} An object containing the tile height and width.
 */
export const calculateTileSize = (canvas, rows, cols, gaps) => {
  const boardWidth = canvas.clientWidth;
  const boardHeight = canvas.clientHeight;

  const totalVerticalGaps = gaps.vertical * (rows - 1);
  const totlaHorizontalGaps = gaps.horizontal * (cols - 1);

  return {
    height: Math.floor((boardHeight - totalVerticalGaps) / rows),
    width: Math.floor((boardWidth - totlaHorizontalGaps) / cols),
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices.
 * @param {Object} pos An object containing the row and column indices of the tile.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvas = (pos, tileSize, gaps) => {
  return {
    x: pos.col * (tileSize.width + gaps.horizontal),
    y: pos.row * (tileSize.height + gaps.vertical),
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices,
 * placing it in the center of the board (not on the left).
 * @param {Object} pos An object containing the row and column indices of the tile.
 * @param {number} group The group size of the tile.
 * @param {number} largestGroup The largest group size in the game.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvasCentered = (
  pos,
  group,
  largestGroup,
  tileSize,
  gaps
) => {
  const { x, y } = getPositionOnCanvas(pos, tileSize, gaps);

  return {
    // If the group is a and the largest one is b, then the row "misses" (b - a) tiles and gaps.
    // We want to put everything in the middle, so we need to add half of it to the x value.
    x: x + ((tileSize.width + gaps.horizontal) * (largestGroup - group)) / 2,
    y,
  };
};

/* -------------------------
            Layout
   ------------------------- */

/**
 * Gets the layout from local storage, or returns the default layout if no value is stored.
 * @returns {string} The layout from local storage, or the default if none is stored.
 */
export const getLayout = () => {
  return localStorage.getItem("layout");
};

/**
 * Sets the layout of the game in local storage and updates the layout select element.
 * @param {string} layout The layout to set, either "compact" or "spacious".
 * @returns {string} The new layout.
 */
export const setLayout = (layout) => {
  localStorage.setItem("layout", layout);

  const select = document.getElementById("select-layout");

  select.value = layout;

  return getLayout();
};

/* -------------------------
      DRAWING ON THE BOARD
   ------------------------- */

/**
 * Draws the completed groups as banners on the board.
 * @param {HTMLCanvasElement} board The canvas element.
 * @param {Array} solvedGroups  The completed groups.
 * @param {Object} tileSize The size of each tile.
 * @param {Object} gaps The gaps between tiles.
 * @param {number} rows The number of rows in the grid.
 * @param {number} cols The number of columns in the grid.
 */
export const drawBanners = (
  board,
  solvedGroups,
  tileSize,
  gaps,
  rows,
  cols
) => {
  let currentRow = rows - 1; // Start from the last row

  for (let i = rows - 1; i >= 0; i--) {
    const group = solvedGroups[i];
    const tiles = group.tiles;
    const groupSize = tiles.length;
    let banner = group.banner;

    // If the group is not empty - it is completed
    if (groupSize > 0) {
      const category = tiles[0].category;
      const terms = [];

      // Move the group tiles to the correct position
      tiles.forEach((tile, column) => {
        terms.push(tile.term);

        const { x, y } = getPositionOnCanvasCentered(
          { row: currentRow, col: column },
          groupSize,
          cols,
          tileSize,
          gaps
        );

        tile.button.style.left = `${x}px`;
        tile.button.style.top = `${y}px`;
      });

      // Draw the banner
      const { x, y } = getPositionOnCanvasCentered(
        { row: currentRow, col: 0 },
        groupSize,
        cols,
        tileSize,
        gaps
      );

      if (banner) {
        // Update the banner's position

        banner.style.left = `${x}px`;
        banner.style.top = `${y}px`;
      } else {
        // Create the banner

        banner = document.createElement("button");

        banner.classList.add("tile");
        banner.classList.add(`group-${i + 1}`);
        banner.classList.add(`completed`);

        banner.style.width = `${
          groupSize * (tileSize.width + gaps.horizontal) - gaps.horizontal
        }px`;
        banner.style.height = `${tileSize.height}px`;

        banner.style.position = "absolute";
        banner.style.left = `${x}px`;
        banner.style.top = `${y}px`;

        banner.innerHTML = `<strong>${category}</strong><br>${terms.join(
          ", "
        )}`;

        board.appendChild(banner);
        group.banner = banner;
      }

      currentRow--;
    }
  }
};

/**
 * Draws the tiles on the board.
 * @param {Array<Object>} positions An array of objects containing row and column indices of the tiles.
 * @param {Set<Object>} unsolvedTiles A Set of objects containing information about the tiles to be drawn.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} cols The number of columns on the board.
 * @param {string} layout The layout of the board. Must be either "spacious" or "compact".
 */
export const drawTiles = (
  positions,
  unsolvedTiles,
  tileSize,
  gaps,
  cols,
  layout
) => {
  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  const rowsIfCompact = Math.ceil(unsolvedTiles.size / cols);

  const remainder = unsolvedTiles.size % cols;

  let i = 0;

  for (const tile of unsolvedTiles) {
    const button = tile.button;
    const { row, col } = positions[i];
    let posXY = null;

    // Center the last row of compact layout
    if (layout === "compact" && remainder > 0 && row === rowsIfCompact - 1) {
      posXY = getPositionOnCanvasCentered(
        { row, col },
        remainder,
        cols,
        tileSize,
        gaps
      );
    } else {
      posXY = getPositionOnCanvas({ row, col }, tileSize, gaps);
    }

    button.style.left = `${posXY.x}px`;
    button.style.top = `${posXY.y}px`;

    i++;
  }
};

/**
 * Draws the board with the remaining tiles and completed groups.
 * @param {HTMLCanvasElement} board The canvas element.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object containing completed groups and remaining tiles.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} rows The number of rows in the grid.
 * @param {number} cols The number of columns in the grid.
 */
export const drawBoard = (
  board,
  positions,
  gameState,
  tileSize,
  gaps,
  rows,
  cols
) => {
  const layout = getLayout();

  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  // Draw the banners
  drawBanners(board, gameState.solvedGroups, tileSize, gaps, rows, cols);

  // Draw the remaining tiles
  drawTiles(positions, gameState.unsolvedTiles, tileSize, gaps, cols, layout);
};

/**
 * Shuffles the positions of the tiles on the board.
 * @param {Set} tiles A set of tile objects.
 * @param {Array} positions An array of positions to shuffle.
 */
export const shuffleBoard = (tiles, positions) => {
  const layout = getLayout();

  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  if (layout === "compact") {
    shuffleArray(positions, tiles.size);
  } else {
    shuffleArray(positions);
  }
};

/**
 * Update the tiles' text, id, ....
 * @param {Set} tiles The tiles array.
 * @param {Set} newTiles The new tiles array.
 */
export const updateTiles = (tiles, newTiles) => {
  assertNotNullOrUndefined([tiles, newTiles]);

  const tilesArray = Array.from(tiles);
  const newTilesArray = Array.from(newTiles);

  for (let i = 0; i < tilesArray.length; i++) {
    tilesArray[i].id = newTilesArray[i].id;
    tilesArray[i].term = newTilesArray[i].term;
    tilesArray[i].category = newTilesArray[i].category;
    tilesArray[i].groupSize = newTilesArray[i].groupSize;
    tilesArray[i].groupIndex = newTilesArray[i].groupIndex;

    // The buton tied to the tile stays the same, it's just the text that changes
    tilesArray[i].button.textContent = tilesArray[i].term;
    tilesArray[i].button.className = "tile";
    tilesArray[i].button.disabled = false;
  }
};

/* -------------------------
          BUTTONS
   ------------------------- */

/**
 * Creates buttons for the tiles and put them on the board.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {Object} gaps An object containing the horizontal and vertical gaps between tiles.
 * @param {number} maxSelections The maximum number of tiles that can be selected.
 */
export const createButtons = (
  board,
  positions,
  gameState,
  tileSize,
  gaps,
  maxSelections
) => {
  let i = 0;

  for (const tile of gameState.tileSet) {
    const button = document.createElement("button");
    const { x, y } = getPositionOnCanvas(positions[i++], tileSize, gaps);

    // Create the button
    button.classList.add("tile");
    button.style.width = `${tileSize.width}px`;
    button.style.height = `${tileSize.height}px`;
    button.textContent = tile.term;
    button.style.position = "absolute";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    tile.button = button; // Bind to a tile

    button.addEventListener("click", () => {
      if (gameState.activeTiles.has(tile)) {
        button.classList.remove("selected");
        gameState.activeTiles.delete(tile);
      } else if (gameState.activeTiles.size < maxSelections) {
        button.classList.add("selected");
        gameState.activeTiles.add(tile);
      } else {
        makeTooManyToast(maxSelections).showToast();
      }
    });

    board.appendChild(button);
  }
};

/**
 * Get the text for the difficulty button based on the difficulty.
 * @param {string} difficulty The difficulty.
 * @returns {string} The text for the difficulty button.
 */
export const getTextForDifficultyButton = (difficulty) => {
  if (difficulty === "easy") {
    return "Easy 🥚";
  } else if (difficulty === "medium") {
    return "Medium 🐤";
  } else if (difficulty === "hard") {
    return "Hard 🐔";
  }

  throw new Error("Invalid difficulty");
};

/**
 * Disable the buttons.
 * @param {Array} buttons The buttons to disable.
 */
export const disableButtons = (buttons) => {
  buttons.forEach((button) => (button.disabled = true));
};

/**
 * Enable the buttons.
 * @param {Array} buttons The buttons to enable.
 */
export const enableButtons = (buttons) => {
  buttons.forEach((button) => (button.disabled = false));
};

/* -------------------------
           TOASTS
   ------------------------- */

/**
 * Creates a Toastify message for submitting a set of tiles.
 * @param {Object} gameState The game state object.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @returns {Object} A Toastify message object and the newly completed group.
 */
export const submitToast = (gameState, groups) => {
  const group = gameState.activeTiles.size;

  let toast = null;

  let newlyCompletedGroup = null;

  if (group < groups[0]) {
    toast = makeTooFewToast(groups[0]);
  } else {
    const activeTilesHashed = hashTilesSet(gameState.activeTiles);

    if (gameState.submissionHistory.has(activeTilesHashed)) {
      toast = TOAST_DUPLICATE;
    } else {
      gameState.submissionHistory.add(activeTilesHashed);

      const correctTiles = Array.from(gameState.activeTiles).reduce(
        (acc, tile) => (tile.groupSize === group ? acc + 1 : acc),
        0
      );

      if (correctTiles === group) {
        newlyCompletedGroup = [...gameState.activeTiles];
        toast = TOAST_CORRECT;
      } else if (2 * correctTiles > group) {
        // ? Maybe give other info (largest group of common categoty, or something else)
        toast = makePartialToast(correctTiles, group);
      } else {
        toast = TOAST_INCORRECT;
      }
    }
  }

  return { toast, newlyCompletedGroup };
};

/* -------------------------
      ERRORS AND EFFECTS
   ------------------------- */

/**
 * Displays the error screen by hiding all other elements except the theme toggle button.
 * Triggers an error toast notification.
 */
export function showErrorScreen() {
  // Hide all body children
  [...document.body.children].forEach((child) => {
    if (child.id !== "error-screen" && child.id !== "theme-toggle-button") {
      child.style.display = "none";
    }
  });

  // Show error screen
  const errorScreen = document.getElementById("error-screen");
  errorScreen.style.display = "flex";

  TOAST_ERROR.showToast();
}

/**
 * Celebrate with confetti.
 * @param {number} duration The duration of the celebration in milliseconds.
 */
export function celebrate(duration) {
  const isMobile = window.innerWidth <= 768;

  var animationEnd = Date.now() + duration;

  var defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 100,
    zIndex: 0,
  };

  var mobileDefaults = {
    startVelocity: 20,
    spread: 120,
    ticks: 80,
    zIndex: 0,
    scalar: 0.5,
  };

  var interval = setInterval(function () {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 100 * (timeLeft / duration);

    const confettiDefaults = isMobile ? mobileDefaults : defaults;

    confetti({
      ...confettiDefaults,
      particleCount,
      origin: { x: randomNum(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...confettiDefaults,
      particleCount,
      origin: { x: randomNum(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Show the win toast and celebrate with confetti.
 * @param {Array} buttons The buttons to disable.
 */
export function win(buttons) {
  disableButtons(buttons);
  TOAST_WINNER.showToast();
  celebrate(confettiDuration);
}

/**
 * Set the theme based on the user's preference.
 */
export function setThemeBasedOnPreference() {
  const prefersDarkScheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Apply dark theme if preferred
  if (prefersDarkScheme) {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
}

/**
 * Clear the banners (colored boxes over completed groups).
 * @param {Array} solvedGroups  The completed groups array.
 */
export function clearBanners(solvedGroups) {
  for (const group of solvedGroups) {
    if (group.banner) {
      group.banner.classList.add("hidden");

      setTimeout(() => {
        group.banner.remove();
        group.banner = null;
      }, 500);
    }
  }
}

/**
 * Spin an emoji button.
 * @param {MouseEvent} event The event when the user clicks the tile.
 */
export function spin(event) {
  const rootStyles = getComputedStyle(document.documentElement);
  const spinDuration = rootStyles
    .getPropertyValue("--animation-speed-spin")
    .trim();

  event.target.classList.add("spin");
  setTimeout(() => {
    event.target.classList.remove("spin");
  }, parseFloat(spinDuration) * 1000);
}
