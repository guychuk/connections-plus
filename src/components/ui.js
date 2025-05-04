import * as utils from "../core/utils.js";
import * as toasts from "./toasts.js";
import confetti from "canvas-confetti";
import { confettiDuration } from "../config/config.json";
import { clickError, clickSettings } from "../events/events.js";

export const CLASS_BLURRED = "blurred";
export const CLASS_DARK_THEME = "dark-theme";

/* --- Tile Position & Size --- */

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
 * @param {Object} boardConfig The board configuration object.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvas = (pos, boardConfig) => {
  const tileWidth = boardConfig.tileSize.width;
  const tileHeight = boardConfig.tileSize.height;
  const horizontalGap = boardConfig.gaps.horizontal;
  const verticalGap = boardConfig.gaps.vertical;

  return {
    x: pos.col * (tileWidth + horizontalGap),
    y: pos.row * (tileHeight + verticalGap),
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices,
 * placing it in the center of the board (not on the left).
 * @param {Object} pos An object containing the row and column indices of the tile.
 * @param {number} group The group size of the tile.
 * @param {Object} boardConfig The board configuration object.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvasCentered = (pos, group, boardConfig) => {
  const { x, y } = getPositionOnCanvas(pos, boardConfig);

  const tileWidth = boardConfig.tileSize.width;
  const horizontalGap = boardConfig.gaps.horizontal;
  const columns = boardConfig.cols;

  return {
    // If the group is a and the largest one is b, then the row "misses" (b - a) tiles and gaps.
    // We want to put everything in the middle, so we need to add half of it to the x value.
    x: x + ((tileWidth + horizontalGap) * (columns - group)) / 2,
    y,
  };
};

/* --- Layout --- */

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

/* --- Drawing on the Board --- */

/**
 * Draws the completed groups as banners on the board.
 * @param {Array} solvedGroups  The completed groups.
 * @param {Object} boardConfig The board configuration object.
 */
const drawBanners = (solvedGroups, boardConfig) => {
  let currentRow = boardConfig.rows - 1; // Start from the last row
  const tileWidth = boardConfig.tileSize.width;
  const tileHeight = boardConfig.tileSize.height;
  const horizontalGap = boardConfig.gaps.horizontal;

  for (let i = currentRow; i >= 0; i--) {
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
          boardConfig
        );

        tile.button.style.left = `${x}px`;
        tile.button.style.top = `${y}px`;
      });

      // Draw the banner
      const { x, y } = getPositionOnCanvasCentered(
        { row: currentRow, col: 0 },
        groupSize,
        boardConfig
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
          groupSize * (tileWidth + horizontalGap) - horizontalGap
        }px`;
        banner.style.height = `${tileHeight}px`;

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
 * Draws the tiles on the board.
 * @param {Array} positions An array of objects containing row and column indices of the tiles.
 * @param {Set} unsolvedTiles A Set of objects containing information about the tiles to be drawn.
 * @param {Object} boardConfig The board configuration object.
 * @param {string} layout The layout of the board. Must be either "spacious" or "compact".
 */
const drawTiles = (positions, unsolvedTiles, boardConfig, layout) => {
  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  const cols = boardConfig.cols;

  const rowsIfCompact = Math.ceil(unsolvedTiles.size / cols);

  const remainder = unsolvedTiles.size % cols;

  let i = 0;

  for (const tile of unsolvedTiles) {
    const button = tile.button;
    const { row, col } = positions[i];
    let posXY = null;

    // Center the last row of compact layout
    if (layout === "compact" && remainder > 0 && row === rowsIfCompact - 1) {
      posXY = getPositionOnCanvasCentered({ row, col }, remainder, boardConfig);
    } else {
      posXY = getPositionOnCanvas({ row, col }, boardConfig);
    }

    button.style.left = `${posXY.x}px`;
    button.style.top = `${posXY.y}px`;

    i++;
  }
};

/**
 * Draws the board with the remaining tiles and completed groups.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object containing completed groups and remaining tiles.
 * @param {Object} boardConfig The board configuration object.
 */
export const drawBoard = (positions, gameState, boardConfig) => {
  const layout = getLayout();

  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  const solvedGroups = gameState.solvedGroups;
  const unsolvedTiles = gameState.unsolvedTiles;

  // Draw the banners
  drawBanners(solvedGroups, boardConfig);

  // Draw the remaining tiles
  drawTiles(positions, unsolvedTiles, boardConfig, layout);
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
    utils.shuffleArray(positions, tiles.size);
  } else {
    utils.shuffleArray(positions);
  }
};

/**
 * Update the tiles' text, id, ....
 * @param {Set} tiles The tiles array.
 * @param {Set} newTiles The new tiles array.
 */
export const updateTiles = (tiles, newTiles) => {
  utils.assertNotNullOrUndefined([tiles, newTiles]);

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

/* --- Buttons --- */

/**
 * Creates buttons for the tiles and put them on the board.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} gameState The game state object.
 * @param {Object} boardConfig The board configuration object.
 */
export const createButtons = (positions, gameState, boardConfig) => {
  let i = 0;

  const tileSize = boardConfig.tileSize;
  const maxSelections = boardConfig.cols;

  for (const tile of gameState.tileSet) {
    const button = document.createElement("button");
    const { x, y } = getPositionOnCanvas(positions[i++], boardConfig);

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
        toasts.makeTooManyToast(maxSelections).showToast();
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

/* --- Toasts --- */

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
    toast = toasts.makeTooFewToast(groups[0]);
  } else {
    const activeTilesHashed = utils.hashTilesSet(gameState.activeTiles);

    if (gameState.submissionHistory.has(activeTilesHashed)) {
      toast = toasts.TOAST_DUPLICATE;
    } else {
      gameState.submissionHistory.add(activeTilesHashed);

      const correctTiles = Array.from(gameState.activeTiles).reduce(
        (acc, tile) => (tile.groupSize === group ? acc + 1 : acc),
        0
      );

      if (correctTiles === group) {
        newlyCompletedGroup = [...gameState.activeTiles];
        toast = toasts.TOAST_CORRECT;
      } else if (2 * correctTiles > group) {
        // ? Maybe give other info (largest group of common categoty, or something else)
        toast = toasts.makePartialToast(correctTiles, group);
      } else {
        toast = toasts.TOAST_INCORRECT;
      }
    }
  }

  return { toast, newlyCompletedGroup };
};

/* --- Settings Panel --- */

export const closeSettingsPanel = (settingsPanel, blurOverlay) => {
  blurOverlay.classList.remove("blurred");
  settingsPanel.classList.remove("blurred");
};

/* --- Error Screen --- */

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

  toasts.TOAST_ERROR.showToast();
}

/* --- Effects --- */

/**
 * Celebrate with confetti.
 * @param {number} duration The duration of the celebration in milliseconds.
 */
function celebrate(duration) {
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
      origin: { x: utils.randomNum(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...confettiDefaults,
      particleCount,
      origin: { x: utils.randomNum(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Show the win toast and celebrate with confetti.
 * @param {Object} gameControlButtons The game control buttons object.
 */
export function win(gameControlButtons) {
  const gameControlButtonsArray = Object.values(gameControlButtons);
  const toDisable = gameControlButtonsArray.filter(
    (button) => button !== gameControlButtons.newGame
  );

  disableButtons(toDisable);
  toasts.TOAST_WINNER.showToast();
  celebrate(confettiDuration);
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

/* --- Theme --- */

/**
 * Set the theme based on the user's preference.
 */
function setThemeBasedOnPreference() {
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
 * Sets the theme based on the user's preference at page load.
 * Listens to changes in the user's preferred color scheme and
 * updates the theme accordingly.
 */
function setInitialTheme() {
  setThemeBasedOnPreference();
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", setThemeBasedOnPreference);
}

/* --- General --- */

/**
 * Initializes the game UI components, including theme toggle, error and settings buttons, settings panel, and game board.
 * Sets up event listeners for user interactions and configures the initial settings based on user preferences and configuration.
 * @param {Object} config The game configuration object.
 * @returns {Object} An object containing the sorted group sizes, the board element, and the gaps object for board layout.
 */
export function initializeGameUI(config) {
  /* --- Initialize theme toggle button --- */

  const themeToggleButton = document.getElementById("theme-toggle-button");
  themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle(CLASS_DARK_THEME);
  });

  // Set the theme based on the user's preference
  setInitialTheme();

  /* --- Initialize error and settings buttons --- */

  const errorEmojiButton = document.getElementById("error-button");
  const settingsButton = document.getElementById("settings-button");

  errorEmojiButton.addEventListener("click", clickError);
  settingsButton.addEventListener("click", clickSettings);

  /* --- Initialize settings panel --- */

  const blurOverlay = document.getElementById("blur-overlay");
  const settingsPanel = document.getElementById("settings-panel");

  // Close settings panel when clicking the blur overlay
  blurOverlay.addEventListener("click", () => {
    closeSettingsPanel(settingsPanel, blurOverlay);
  });

  /* --- Initialize board --- */
  const groups = config["groups"].sort((a, b) => a - b);
  utils.assert(!utils.containsDulpicates(groups), "Groups contain duplicates");

  // Update groups paragraph/subtitle
  const groupsParagraph = document.getElementById("subtitle");
  groupsParagraph.textContent = `Group Sizes are ${groups.join(", ")}`;

  /* --- Initialize board --- */

  const board = document.getElementById("board");
  const boardCSS = getComputedStyle(board);

  const horizontalGap = parseFloat(boardCSS.columnGap);
  const verticalGap = parseFloat(boardCSS.rowGap);
  const gaps = { horizontal: horizontalGap, vertical: verticalGap };

  // Set initial layout

  let initialLayout = getLayout();

  if (!initialLayout) {
    initialLayout = setLayout(config["layout"]);
  }

  return { groups, board, gaps };
}
