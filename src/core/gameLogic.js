import { makePositions, hashTilesSet } from "../core/utils";
import {
  calculateTileSize,
  createButtons,
  shuffleBoard,
  updateTiles,
  getLayout,
  getTextForDifficultyButton,
  clearToasts,
  addMistake,
  resetMistakes,
  updateSubtitle,
  adjustButtonFontSizeWithLineBreaks,
  hideLoadingScreen,
  showLoadingScreen,
  getLanguage,
} from "../components/ui";
import { clickDeselect, clickSolve } from "../events/events";
import * as toasts from "../components/toasts";

/* --- Game Properties --- */

/**
 * Get the number of tags for a given difficulty and number of groups.
 * @param {string} difficulty The difficulty.
 * @param {number} numGroups The number of groups.
 * @returns {number} The number of tags.
 */
const getNumOfTags = (difficulty, numGroups) => {
  switch (difficulty) {
    case "easy":
      return Math.max(1, numGroups);
    case "medium":
      return Math.max(1, Math.floor(numGroups / 2));
    case "hard":
      return Math.max(1, Math.floor(numGroups / 3));
  }
};

/* --- Tiles --- */

/**
 * Create tiles for a new game.
 * @param {Array} groupsSizes array of group sizes.
 * @param {string} difficulty difficulty
 * @returns {Set} set of tiles.
 */
async function getNewTiles(groupsSizes, difficulty) {
  const language = getLanguage();
  const numTags = getNumOfTags(difficulty, groupsSizes.length);

  const groupsSizesParam = encodeURIComponent(JSON.stringify(groupsSizes));

  const response = await fetch(
    `/api/get-tiles?groupsSizes=${groupsSizesParam}&numTags=${numTags}&language=${language}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch tiles: ${error.message}`);
  }

  const tiles = await response.json();
  return new Set(tiles);
}

/* --- Game Initialization --- */

/**
 * Initialize the game board with tiles.
 * @param {Object} config The config object.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups An array of group sizes.
 * @param {HTMLCanvasElement} board The board element.
 * @param {Object} gaps The gaps object containing horizontal and vertical gaps.
 * @returns {Object} An object containing the game state, positions array and tile size object.
 */
export async function initializeGame(config, difficulty, groups, board, gaps) {
  // Get board grid layout
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  // Tile size and positions
  const tileSize = calculateTileSize(board, rows, cols, gaps);
  const positions = makePositions(rows, cols);

  // Game state
  const solvedGroups = Array.from({ length: groups.length }, () => ({
    tiles: [],
    banner: null,
  }));

  const difficultyButton = document.getElementById("difficulty-button");

  difficultyButton.dataset.difficulty = difficulty;
  difficultyButton.textContent = getTextForDifficultyButton(difficulty);

  updateSubtitle(groups, solvedGroups);

  const tileSet = await getNewTiles(groups, difficulty);

  // Game state
  const gameState = {
    activeTiles: new Set(),
    submissionHistory: new Set(),
    solvedGroups: solvedGroups,
    tileSet: tileSet,
    unsolvedTiles: new Set(tileSet),
    gameWon: false,
    gameOver: false,
    mistakesAllowed: config["mistakesAllowed"],
    mistakesMade: 0,
  };

  const boardConfig = {
    board: board,
    freePositions: positions,
    tileSize: tileSize,
    gaps: gaps,
    rows: rows,
    cols: cols,
  };

  hideLoadingScreen();

  createButtons(positions, gameState, boardConfig);

  const tileButtons = [...tileSet].map((tile) => tile.button);

  adjustButtonFontSizeWithLineBreaks(tileButtons);

  // Shuffle board
  shuffleBoard(tileSet, positions, getLayout());

  return {
    gameState,
    positions,
    boardConfig,
  };
}

/**
 * Reset the game state and fetch new tiles.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups The group sizes.
 * @param {Set} tiles The set of tiles to replace.
 * @param {Object} gameState The game state object.
 * @param {Array} positions The array of positions for the tiles.
 */
export async function resetGame(difficulty, groups, gameState, positions) {
  clearToasts();

  // Reset game state

  gameState.submissionHistory.clear();
  gameState.activeTiles.clear();
  gameState.unsolvedTiles.clear();

  for (let i = 0; i < gameState.solvedGroups.length; i++) {
    gameState.solvedGroups[i].tiles.length = 0;
  }

  updateSubtitle(groups, gameState.solvedGroups);

  showLoadingScreen();

  // Get new tiles
  const newTiles = await getNewTiles(groups, difficulty);

  // Get new list of positions

  const rows = groups.length;
  const cols = groups[rows - 1];

  positions.length = 0;
  positions.push(...makePositions(rows, cols));

  hideLoadingScreen();

  // Keep the same tiles set as before, but replace the contents
  updateTiles(gameState.tileSet, newTiles);

  const tileButtons = [...gameState.tileSet].map((tile) => tile.button);

  adjustButtonFontSizeWithLineBreaks(tileButtons);

  for (const tile of gameState.tileSet) {
    gameState.unsolvedTiles.add(tile);
  }

  gameState.gameWon = false;
  gameState.gameOver = false;

  gameState.mistakesMade = 0;

  resetMistakes(gameState.mistakesAllowed);
}

/* --- Complete Group Logic --- */

/**
 * Complete a group of tiles.
 * @param {number} groupIndex The index of the group to complete.
 * @param {Object} gameState The game state object.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Array} groups The array of group sizes.
 */
export const completeGroup = (groupIndex, gameState, positions, groups) => {
  gameState.solvedGroups[groupIndex].tiles = [];

  // Move and then hide the tiles in that group
  for (let tile of gameState.activeTiles) {
    gameState.solvedGroups[groupIndex].tiles.push(tile);
    gameState.unsolvedTiles.delete(tile);
    gameState.activeTiles.delete(tile);

    tile.button.classList.remove("selected");
    tile.button.classList.add("hidden");
    tile.button.classList.add(`group-${groupIndex + 1}`);
    tile.button.classList.add(`completed`);

    tile.button.disabled = true;
  }

  const rows = groups.length;
  const cols = groups[groups.length - 1];
  const numOfsolvedGroups = gameState.solvedGroups.filter(
    (group) => group.tiles.length > 0
  ).length;

  // Update free positions
  positions.length = 0;
  positions.push(...makePositions(rows - numOfsolvedGroups, cols));
};

/**
 * Solves the next group of tiles.
 * @param {Array} groups The array of group sizes.
 * @param {Object} gameState The game state object.
 * @param {Array} positions The array of positions for the tiles.
 * @returns {boolean} True if a group was solved, false if all groups were solved.
 */
export const solveNextGroup = (groups, gameState, positions) => {
  let groupIndex = -1;

  // Find the last unsolved group
  for (let i = 0; i < gameState.solvedGroups.length; i++) {
    if (gameState.solvedGroups[i].tiles.length === 0) {
      groupIndex = i;
    }
  }

  if (groupIndex === -1) {
    return false;
  }

  // Deselect all tiles
  clickDeselect(gameState.activeTiles);

  // Select all tiles in that group
  for (let tile of gameState.unsolvedTiles) {
    if (tile.groupIndex === groupIndex) {
      gameState.activeTiles.add(tile);
    }
  }

  completeGroup(groupIndex, gameState, positions, groups);

  return true;
};

/* --- Toasts --- */

/**
 * Creates a Toastify message for submitting a set of tiles.
 * @param {Object} gameState The game state object.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @param {Array} positions The array of positions for the tiles.
 * @param {Object} boardConfig The board configuration object.
 * @param {Object} gameControlButtons The game control buttons object.
 * @returns {Object} A Toastify message object and the newly completed group.
 */
export const submitToast = (
  gameState,
  groups,
  positions,
  boardConfig,
  gameControlButtons
) => {
  const group = gameState.activeTiles.size;

  let toast = null;

  let newlyCompletedGroup = null;

  if (group < groups[0]) {
    toast = toasts.makeTooFewToast(groups[0]);
  } else {
    const activeTilesHashed = hashTilesSet(gameState.activeTiles);

    if (gameState.submissionHistory.has(activeTilesHashed)) {
      toast = toasts.makeDuplicateToast();
    } else {
      gameState.submissionHistory.add(activeTilesHashed);

      const correctTiles = Array.from(gameState.activeTiles).reduce(
        (acc, tile) => (tile.groupSize === group ? acc + 1 : acc),
        0
      );

      // Correct!
      if (correctTiles === group) {
        newlyCompletedGroup = [...gameState.activeTiles];
        toast = toasts.makeCorrectToast();
      } else {
        // Incorrect

        if (2 * correctTiles > group) {
          // ? Maybe give other info (largest group of common categoty, or something else)
          toast = toasts.makePartialToast(correctTiles, group);
        } else {
          toast = toasts.makeIncorrectToast();
        }

        makeMistake(
          gameState,
          groups,
          positions,
          boardConfig,
          gameControlButtons
        );
      }
    }
  }

  return { toast, newlyCompletedGroup };
};

/**
 * Increments the mistakes counter by one and updates the mistakes counter UI.
 * If the number of mistakes made is equal to the number of mistakes allowed,
 * shows a toast message indicating that the player lost.
 * @param {Object} gameState The game state object.
 */
const makeMistake = (
  gameState,
  groups,
  positions,
  boardConfig,
  gameControlButtons
) => {
  gameState.mistakesMade++;
  addMistake();

  if (gameState.mistakesMade === gameState.mistakesAllowed) {
    toasts.makeLoserToast().showToast();
    clickSolve(gameState, groups, positions, boardConfig, gameControlButtons);
  }
};
