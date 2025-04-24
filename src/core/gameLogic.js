import {
  getTags,
  getCategories,
  getCategoryName,
  getTerms,
} from "../services/supabase";
import { makePositions } from "../core/utils";
import {
  calculateTileSize,
  createButtons,
  shuffleBoard,
  updateTiles,
  getLayout,
} from "../components/ui";
import { SupabaseClient } from "@supabase/supabase-js";
import { TOAST_WINNER } from "../components/toasts";
import { clickDeselect } from "../events/events";

/* ------------------------
      GAME PROPERTIES
  ------------------------ */

/**
 * Get the number of tags for a given difficulty and number of groups.
 * @param {string} difficulty The difficulty.
 * @param {number} numGroups The number of groups.
 * @returns {number} The number of tags.
 */
const getNumOfTags = (difficulty, numGroups) => {
  switch (difficulty) {
    case "easy":
      return numGroups;
    case "medium":
      return Math.floor(numGroups / 2);
    case "hard":
      return Math.floor(numGroups / 3);
  }
};

/* -------------------------
            TILES
   ------------------------- */

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
export const getNewTiles = async (client, groups, difficulty) => {
  const numGroups = groups.length;
  const numTags = getNumOfTags(difficulty, numGroups);

  var categories;
  const categoriesSet = new Set();

  var iterations = 0;

  while (iterations < 20) {
    const tags = (await getTags(client, numTags)).map((tag) => tag.tag);

    let i = groups.length;

    categories = Array.from({ length: numGroups }, () => null);
    categoriesSet.clear();

    // Test this choice of Tags
    while (0 < i) {
      const newCategories = (
        await getCategories(client, tags, groups[i - 1])
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
      getCategoryName(client, category.cat_id)
    );

    const categoriesNames = await Promise.all(categoriesNamesPromises);

    // Get terms

    const fetchTermsPromises = groups.map((groupSize, index) =>
      getTerms(client, categories[index].cat_id, groupSize).then((terms) => {
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
};

/* -------------------------
  GAME INITIALIZATION AND RESET
   ------------------------- */

/**
 * Initialize the game board with tiles.
 * @param {SupabaseClient} client The Supabase client.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups An array of group sizes.
 * @param {HTMLCanvasElement} board The board element.
 * @param {Object} gaps The gaps object containing horizontal and vertical gaps.
 * @returns {Object} An object containing the tiles set, selected tiles set, positions array and tile size object.
 */
export const initializeGame = async (
  client,
  difficulty,
  groups,
  board,
  gaps
) => {
  // Get board grid layout
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  // Tile size and positions
  const tileSize = calculateTileSize(board, rows, cols, gaps);
  const positions = makePositions(rows, cols);

  // Game state
  const selectedTiles = new Set();
  const previousSubmissions = new Set();
  const completedGroups = Array.from({ length: groups.length }, () => ({
    tiles: [],
    banner: null,
  }));

  // Get tiles
  const allTiles = await getNewTiles(client, groups, difficulty);

  createButtons(
    board,
    positions,
    allTiles,
    tileSize,
    gaps,
    selectedTiles, // ref
    cols // max selections
  );

  // Shuffle board
  shuffleBoard(allTiles, positions, getLayout());

  return {
    allTiles,
    selectedTiles,
    previousSubmissions,
    completedGroups,
    positions,
    tileSize,
  };
};

/**
 * Reset the game state and fetch new tiles.
 * @param {SupabaseClient} client The Supabase client.
 * @param {string} difficulty The difficulty.
 * @param {Array} groups The group sizes.
 * @param {Set} tiles The set of tiles to replace.
 * @param {Set} previousSubmissions The set of previously submitted tiles.
 * @param {Set} selectedTiles The set of currently selected tiles.
 * @param {Set} remainngTiles The set of remaining tiles.
 * @param {Array} completedGroups The array of completed groups.
 * @param {Array} positions The array of positions for the tiles.
 */
export const resetGame = async (
  SupabaseClient,
  difficulty,
  groups,
  tiles,
  previousSubmissions,
  selectedTiles,
  remainngTiles,
  completedGroups,
  positions
) => {
  // If won but not by solving automatically
  if (remainngTiles.size === 0 && TOAST_WINNER.timeOutVal) {
    TOAST_WINNER.hideToast();
  }

  // Reset game state

  previousSubmissions.clear();
  selectedTiles.clear();
  remainngTiles.clear();

  for (let i = 0; i < completedGroups.length; i++) {
    completedGroups[i].tiles.length = 0;
  }

  // Get new tiles
  const newTiles = await getNewTiles(SupabaseClient, groups, difficulty);

  // Get new list of positions

  const rows = groups.length;
  const cols = groups[rows - 1];

  positions.length = 0;
  positions.push(...makePositions(rows, cols));

  // Keep the same tiles set as before, but replace the contents
  updateTiles(tiles, newTiles);

  for (const tile of tiles) {
    remainngTiles.add(tile);
  }
};

export const completeGroup = (
  groupIndex,
  completedGroups,
  selectedTiles,
  remainngTiles,
  positions,
  groups
) => {
  completedGroups[groupIndex].tiles = [];

  // Move and then hide the tiles in that group
  for (let tile of selectedTiles) {
    completedGroups[groupIndex].tiles.push(tile);
    remainngTiles.delete(tile);
    selectedTiles.delete(tile);

    tile.button.classList.remove("selected");
    tile.button.classList.add("hidden");
    tile.button.classList.add(`group-${groupIndex + 1}`);
    tile.button.classList.add(`completed`);

    tile.button.disabled = true;
  }

  const rows = groups.length;
  const cols = groups[groups.length - 1];
  const numOfCompletedGroups = completedGroups.filter(
    (group) => group.tiles.length > 0
  ).length;

  // Update free positions
  positions.length = 0;
  positions.push(...makePositions(rows - numOfCompletedGroups, cols));
};

export const solveNextGroup = (
  completedGroups,
  groups,
  selectedTiles,
  remainingTiles,
  positions
) => {
  let groupIndex = -1;

  // Find the last unsolved group
  for (let i = 0; i < completedGroups.length; i++) {
    if (completedGroups[i].tiles.length === 0) {
      groupIndex = i;
    }
  }

  if (groupIndex === -1) {
    return false;
  }

  // Deselect all tiles
  clickDeselect(selectedTiles);

  // Select all tiles in that group
  for (let tile of remainingTiles) {
    if (tile.groupIndex === groupIndex) {
      selectedTiles.add(tile);
    }
  }

  completeGroup(
    groupIndex,
    completedGroups,
    selectedTiles,
    remainingTiles,
    positions,
    groups
  );

  return true;
};
