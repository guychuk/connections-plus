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
  showErrorScreen,
  getLayout,
  drawBoard,
} from "../components/ui";
import { SupabaseClient } from "@supabase/supabase-js";
import { TOAST_WINNER } from "../components/toasts";

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

    while (0 < i) {
      const newCategories = await getCategories(client, tags, groups[i - 1]);

      const newValidCategories = newCategories.filter((category) => {
        return !categoriesSet.has(category.cat_id);
      });

      // If no categories were found, try again with different tags
      if (newValidCategories.length === 0) {
        console.error("No categories found, trying again with different tags");
        break;
      }

      for (let j = 0; j < newValidCategories.length && i > 0; j++) {
        categories[i - 1] = newValidCategories[j];
        categoriesSet.add(newValidCategories[j].cat_id);
        i--;
      }
    }

    if (i > 0) {
      iterations++;
      continue;
    }

    const categoriesNamesPromises = categories.map((category) =>
      getCategoryName(client, category.cat_id)
    );

    const categoriesNames = await Promise.all(categoriesNamesPromises);

    const fetchTermsPromises = groups.map((groupSize, index) =>
      getTerms(client, categories[index].cat_id, groupSize).then((terms) => {
        return terms.map((term) => term.term);
      })
    );

    const allTerms = await Promise.all(fetchTermsPromises);

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

/**
 * Initialize the game board with tiles.
 * @param {SupabaseClient} client The Supabase client.
 * @param {HTMLButtonElement} difficultyButton The difficulty button element.
 * @param {Array} groups An array of group sizes.
 * @param {HTMLCanvasElement} board The board element.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @returns {Object} An object containing the tiles set, selected tiles set, positions array and tile size object.
 */
export const initializeGame = async (
  client,
  difficultyButton,
  groups,
  board,
  hgap,
  vgap
) => {
  // Get board grid layout
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  const tileSize = calculateTileSize(board, rows, cols, hgap, vgap);

  const positions = makePositions(rows, cols);

  const selectedTiles = new Set();

  const previousSubmissions = new Set();

  const completedGroups = Array.from({ length: groups.length }, () => ({
    tiles: [],
    banner: null,
  }));

  const difficulty = difficultyButton.dataset.difficulty;

  const allTiles = await getNewTiles(client, groups, difficulty);

  createButtons(
    board,
    positions,
    allTiles,
    tileSize,
    hgap,
    vgap,
    selectedTiles, // ref
    cols // max selections
  );

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

export const resetGame = async (
  SupabaseClient,
  difficultyButton,
  afterWin,
  groups,
  tiles,
  previousSubmissions,
  selectedTiles,
  completedGroups,
  positions
) => {
  if (afterWin) {
    TOAST_WINNER.hideToast();
  }

  previousSubmissions.clear();
  selectedTiles.clear();

  for (let i = 0; i < completedGroups.length; i++) {
    completedGroups[i].tiles.length = 0;
  }

  const layout = getLayout();

  const difficulty = difficultyButton.dataset.difficulty;

  const newTiles = await getNewTiles(SupabaseClient, groups, difficulty);

  positions.length = 0;

  const rows = groups.length;

  const cols = groups[rows - 1];

  positions.push(...makePositions(rows, cols));

  // Keep the same tiles set as before, but replace the contents
  updateTiles(tiles, newTiles);
};

/**
 * Process the new completed group and return the new positions array.
 * @param {Set} selectedTiles The set of selected tiles.
 * @param {Array} groups An array of group sizes in the game, sorted.
 * @param {Array} positions An array of positions for the tiles.
 * @returns {Array} An array of positions for the tiles.
 */
export const processNewCompletedGroup = (selectedTiles, groups, positions) => {
  selectedTiles.clear();

  // Update free positions
  const cols = groups[groups.length - 1];
  const rows = positions.length / cols - 1;

  return makePositions(rows, cols);
};
