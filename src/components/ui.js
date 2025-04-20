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

export const showErrorScreen = () => {
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
};

/**
 * Calculates the tile size based on the canvas size and the number of rows and columns.
 * @param {HTMLCanvasElement} canvas The canvas element.
 * @param {number} rows Number of rows in the grid.
 * @param {number} cols Number of columns in the grid.
 * @param {number} hgap Horizontal gap between tiles.
 * @param {number} vgap Vertical gap between tiles.
 * @returns {Object} An object containing the tile height and width.
 */
export const calculateTileSize = (canvas, rows, cols, hgap, vgap) => {
  const boardWidth = canvas.clientWidth;
  const boardHeight = canvas.clientHeight;

  const vgaps = vgap * (rows - 1);
  const hgaps = hgap * (cols - 1);

  return {
    height: Math.floor((boardHeight - vgaps) / rows),
    width: Math.floor((boardWidth - hgaps) / cols),
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices.
 * @param {Object} pos An object containing the row and column indices of the tile.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap Horizontal gap between tiles.
 * @param {number} vgap Vertical gap between tiles.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
const getPositionOnCanvas = (pos, tileSize, hgap, vgap) => {
  return {
    x: pos.col * (tileSize.width + hgap),
    y: pos.row * (tileSize.height + vgap),
  };
};

/**
 * Calculates the position of a tile on the canvas based on its row and column indices,
 * placing it in the center of the board (not on the left).
 * @param {Object} pos An object containing the row and column indices of the tile.
 * @param {number} group The group size of the tile.
 * @param {number} largestGroup The largest group size in the game.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap Horizontal gap between tiles.
 * @param {number} vgap Vertical gap between tiles.
 * @returns {Object} An object containing the x and y coordinates of the tile on the canvas.
 */
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
    // If the group is a and the largest one is b, then the row "misses" (b - a) tiles and gaps.
    // We want to put everything in the middle, so we need to add half of it to the x value.
    x: x + ((tileSize.width + hgap) * (largestGroup - group)) / 2,
    y,
  };
};

/**
 * Shuffles the positions of the tiles on the board.
 * @param {Set} tiles A set of tile objects.
 * @param {Array} positions An array of positions to shuffle.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @param {string} layout The layout of the board ("compact" or "spacious").
 */
export const shuffleBoard = (
  tiles,
  positions,
  columns,
  tileSize,
  hgap,
  vgap,
  layout
) => {
  let i = 0;
  const remainder = tiles.size % columns;
  const lastRow = Math.floor(tiles.size / columns) - (remainder > 0 ? 0 : 1);
  const compact = layout === "compact";

  if (layout !== "spacious" && layout !== "compact") {
    console.error("Layout must be either 'spacious' or 'compact'");
    showErrorScreen();
  }

  if (compact) {
    shuffleArray(positions, tiles.size);
  } else {
    shuffleArray(positions);
  }

  for (let tile of tiles) {
    let position = null;

    if (compact && remainder > 0 && positions[i].row === lastRow) {
      position = getPositionOnCanvasCentered(
        positions[i],
        remainder,
        columns,
        tileSize,
        hgap,
        vgap
      );
    } else {
      position = getPositionOnCanvas(positions[i], tileSize, hgap, vgap);
    }

    tile.button.style.left = `${position.x}px`;
    tile.button.style.top = `${position.y}px`;
    i++;
  }
};

/**
 * Creates buttons for the tiles and put them on the board.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Set} tiles A set of tile objects.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @param {Set} selectedTiles A set of selected tiles.
 * @param {number} maxSelections The maximum number of tiles that can be selected.
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
  let i = 0;

  assertNotNullOrUndefined([
    board,
    positions,
    tiles,
    tileSize,
    hgap,
    vgap,
    selectedTiles,
    maxSelections,
  ]);

  for (const tile of tiles) {
    const button = document.createElement("button");
    const { x, y } = getPositionOnCanvas(positions[i++], tileSize, hgap, vgap);

    button.classList.add("tile");
    button.style.width = `${tileSize.width}px`;
    button.style.height = `${tileSize.height}px`;
    button.textContent = tile.term;
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

    board.appendChild(button);
  }
};

/**
 * Creates a Toastify message for submitting a set of tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 * @param {Set} previousSubmissions The set of previously submitted tiles.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @returns {Object} A Toastify message object and the newly completed group.
 */
export const submitToast = (selectedTiles, previousSubmissions, groups) => {
  const group = selectedTiles.size;

  let toast = null;

  let newlyCompletedGroup = null;

  if (group < groups[0]) {
    toast = makeTooFewToast(groups[0]);
  } else if (group > groups[groups.length - 1]) {
    toast = makeTooManyToast(groups[groups.length - 1]);
  } else {
    const selectedTilesHashed = hashTilesSet(selectedTiles);

    if (previousSubmissions.has(selectedTilesHashed)) {
      toast = TOAST_DUPLICATE;
    } else {
      previousSubmissions.add(selectedTilesHashed);

      const correctTiles = Array.from(selectedTiles).reduce(
        (acc, tile) => (tile.groupSize === group ? acc + 1 : acc),
        0
      );

      if (correctTiles === group) {
        newlyCompletedGroup = [...selectedTiles];
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

/**
 * Reposition the tiles on the board.
 * @param {HTMLCanvasElement} board The board element containing the tiles.
 * @param {string} layout The layout of the board ("compact" or "spacious").
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Array} completedGroups An array of completed groups.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @param {Array} positions An array of positions for the tiles.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 */
export const repositionTiles = (
  board,
  layout,
  remainngTiles,
  completedGroups,
  groups,
  positions,
  tileSize,
  hgap,
  vgap
) => {
  // Move the completed ones down

  const rows = groups.length;
  const cols = groups[groups.length - 1];

  let row = rows - 1;

  // Reverse order so the larger groups are drawn first, at the bottom
  for (let i = rows - 1; i >= 0; i--) {
    const tiles = completedGroups[i].tiles;
    const group = tiles.length;

    let button = completedGroups[i].button;

    // The player completed this group
    if (group > 0) {
      const categoty = tiles[0].category;
      const terms = [];

      for (let col = 0; col < group; col++) {
        const { x, y } = getPositionOnCanvasCentered(
          { row, col },
          group,
          cols,
          tileSize,
          hgap,
          vgap
        );

        tiles[col].button.style.left = `${x}px`;
        tiles[col].button.style.top = `${y}px`;

        terms.push(tiles[col].term);
      }

      const firstPos = getPositionOnCanvasCentered(
        { row, col: 0 },
        group,
        cols,
        tileSize,
        hgap,
        vgap
      );

      if (button === null) {
        completedGroups[i].button = document.createElement("button");
        button = completedGroups[i].button;

        button.classList.add("tile");
        button.classList.add(`group-${i + 1}`);
        button.classList.add(`completed`);

        button.style.width = `${group * (tileSize.width + hgap) - hgap}px`;
        button.style.height = `${tileSize.height}px`;
        button.style.position = "absolute";
        button.style.left = `${firstPos.x}px`;

        button.innerHTML = `<strong>${categoty}</strong><br>${terms.join(
          ", "
        )}`;

        board.appendChild(button);
      }

      button.style.top = `${firstPos.y}px`;

      row--;
    }
  }

  // Now draw the rest
  shuffleBoard(remainngTiles, positions, cols, tileSize, hgap, vgap, layout);
};

/**
 * Celebrate with confetti.
 * @param {number} duration The duration of the celebration in milliseconds.
 */
export const celebrate = (duration) => {
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
};

/**
 * Show the win toast and celebrate with confetti.
 */
export const win = () => {
  TOAST_WINNER.showToast();
  celebrate(confettiDuration);
};

/**
 * Set the theme based on the user's preference.
 */
export const setThemeBasedOnPreference = () => {
  const prefersDarkScheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Apply dark theme if preferred
  if (prefersDarkScheme) {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
};

/**
 * Get the text for the difficulty button based on the difficulty.
 * @param {string} difficulty The difficulty.
 * @returns {string} The text for the difficulty button.
 */
export const getDifficultyButtonText = (difficulty) => {
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
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
};

/**
 * Enable the buttons.
 * @param {Array} buttons The buttons to enable.
 */
export const enableButtons = (buttons) => {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }
};

/**
 * Clear the banners (colored boxes over completed groups).
 * @param {Array} completedGroups The completed groups array.
 */
export const clearBanners = (completedGroups) => {
  for (let i = 0; i < completedGroups.length; i++) {
    if (completedGroups[i].button) {
      completedGroups[i].button.classList.add("hidden");

      setTimeout(() => {
        completedGroups[i].button.remove();
        completedGroups[i].button = null;
      }, 500);
    }
  }
};

/**
 * Update the tiles.
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

/**
 * Spin the emoji.
 * @param {MouseEvent} event The event when the user clicks the tile.
 */
export const spin = (event) => {
  const rootStyles = getComputedStyle(document.documentElement);
  const spinDuration = rootStyles
    .getPropertyValue("--animation-speed-spin")
    .trim();

  event.target.classList.add("spin");
  setTimeout(() => {
    event.target.classList.remove("spin");
  }, parseFloat(spinDuration) * 1000);
};
