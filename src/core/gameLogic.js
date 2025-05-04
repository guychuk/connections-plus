import * as supabase from "../services/supabase";
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
} from "../components/ui";
import { SupabaseClient } from "@supabase/supabase-js";
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
 * Make a tile object.
 * @param {string} id The ID of the tile.
 * @param {string} term The term of the tile.
 * @param {string} category The category of the tile.
 * @param {number} groupSize The group size of the tile.
 * @param {number} groupIndex The group index of the tile.
 * @param {HTMLButtonElement} button The button element for the tile.
 * @returns {Object} The tile object.
 */
const makeTile = (id, term, category, groupSize, groupIndex, button) => {
  return {
    id,
    term,
    category,
    groupSize,
    groupIndex,
    button,
  };
};

/**
 * Create tiles for a new game.
 * @param {SupabaseClient} client Supabase client.
 * @param {Array} groups array of group sizes.
 * @param {string} difficulty difficulty
 * @returns {Set} set of tiles.
 */
async function getNewTiles(client, groups, difficulty) {
  const numGroups = groups.length;
  const numTags = getNumOfTags(difficulty, numGroups);

  var categories;
  const categoriesSet = new Set();

  var iterations = 0;

  while (iterations < 25) {
    const tags = (await supabase.getTags(client, numTags)).map(
      (tag) => tag.tag
    );

    let i = groups.length;

    categories = Array.from({ length: numGroups }, () => null);
    categoriesSet.clear();

    // Test this choice of Tags
    while (0 < i) {
      const newCategories = (
        await supabase.getCategories(client, tags, groups[i - 1])
      ).filter((category) => !categoriesSet.has(category.cat_id));

      // If no categories were found, try again with different tags
      if (newCategories.length === 0) {
        console.error(
          "Did not find new categories, trying again with different tags"
        );
        break;
      }

      for (let j = 0; j < newCategories.length && i > 0; j++) {
        categories[i - 1] = newCategories[j];
        categoriesSet.add(newCategories[j].cat_id);
        i--;
      }
    }

    if (i > 0) {
      iterations++;
      continue;
    }

    // Get categories names

    const categoriesNamesPromises = categories.map((category) =>
      supabase.getCategoryName(client, category.cat_id)
    );

    const categoriesNames = await Promise.all(categoriesNamesPromises);

    // Get terms

    const fetchTermsPromises = groups.map((groupSize, index) =>
      supabase
        .getTerms(client, categories[index].cat_id, groupSize)
        .then((terms) => {
          return terms.map((term) => term.term);
        })
    );

    const allTerms = await Promise.all(fetchTermsPromises);

    // Check for duplicate terms
    if (new Set(allTerms.flat()).size !== allTerms.flat().length) {
      console.error("Duplicate terms found, trying again");
      iterations++;
      continue;
    }

    const tiles = new Set();

    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < groups[i]; j++) {
        tiles.add(
          makeTile(
            tiles.length, // id
            allTerms[i][j], // term
            categoriesNames[i], // category
            groups[i], // groupSize
            i, // groupIndex
            null // button (not yet created)
          )
        );
      }
    }

    return tiles;
  }
}

/* --- Game Initialization --- */

/**
 * Initialize the game board with tiles.
 * @param {Object} config The config object.
 * @param {SupabaseClient} client The Supabase client.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups An array of group sizes.
 * @param {HTMLCanvasElement} board The board element.
 * @param {Object} gaps The gaps object containing horizontal and vertical gaps.
 * @returns {Object} An object containing the game state, positions array and tile size object.
 */
export async function initializeGame(
  config,
  client,
  difficulty,
  groups,
  board,
  gaps
) {
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

  const tileSet = await getNewTiles(client, groups, difficulty);

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

  createButtons(positions, gameState, boardConfig);

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
 * @param {SupabaseClient} client The Supabase client.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups The group sizes.
 * @param {Set} tiles The set of tiles to replace.
 * @param {Object} gameState The game state object.
 * @param {Array} positions The array of positions for the tiles.
 */
export async function resetGame(
  supabaseClient,
  difficulty,
  groups,
  gameState,
  positions
) {
  clearToasts();

  // Reset game state

  gameState.submissionHistory.clear();
  gameState.activeTiles.clear();
  gameState.unsolvedTiles.clear();

  for (let i = 0; i < gameState.solvedGroups.length; i++) {
    gameState.solvedGroups[i].tiles.length = 0;
  }

  // Get new tiles
  const newTiles = await getNewTiles(supabaseClient, groups, difficulty);

  // Get new list of positions

  const rows = groups.length;
  const cols = groups[rows - 1];

  positions.length = 0;
  positions.push(...makePositions(rows, cols));

  // Keep the same tiles set as before, but replace the contents
  updateTiles(gameState.tileSet, newTiles);

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
