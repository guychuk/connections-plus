import { fetchCategories, fetchTerms } from "./supabase";
import { shuffleArray, makePositions } from "./utils";
import { calculateTileSize, createButtons, shuffleBoard } from "./ui";
import { SupabaseClient } from "@supabase/supabase-js";

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
 * @returns {Set} set of tiles.
 */
export const makeTiles = async (client, groups) => {
  const categories = await fetchCategories(client, groups.length);

  const fetchTermsPromises = groups.map((groupSize, index) =>
    fetchTerms(client, categories[index].id, groupSize)
  );

  const allTerms = await Promise.all(fetchTermsPromises);

  const tiles = new Set();

  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i]; j++) {
      tiles.add(
        makeTile(
          tiles.length, // id
          allTerms[i][j].term, // term
          categories[i].category, // category
          groups[i], // groupSize
          i, // groupIndex
          null // button (not yet created)
        )
      );
    }
  }

  return tiles;
};

/**
 * Initialize the game board with tiles.
 * @param {SupabaseClient} client The Supabase client.
 * @param {Array} groups An array of group sizes.
 * @param {HTMLCanvasElement} board The board element.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @returns {Object} An object containing the tiles set, selected tiles set, positions array and tile size object.
 */
export const initializeGame = async (client, groups, board, hgap, vgap) => {
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  const tileSize = calculateTileSize(board, rows, cols, hgap, vgap);
  const positions = makePositions(rows, cols);
  const selectedTiles = new Set();
  const tiles = await makeTiles(client, groups);

  shuffleArray(positions);

  createButtons(
    board,
    positions,
    tiles,
    tileSize,
    hgap,
    vgap,
    selectedTiles,
    groups[groups.length - 1]
  );

  return { tiles, selectedTiles, positions, tileSize };
};

/**
 * Reset the game board with new tiles.
 * @param {SupabaseClient} SupabaseClient The Supabase client.
 * @param {Array} groups An array of group sizes.
 * @param {Set} tiles The set of tiles.
 * @param {Object} tileSize An object containing the height and width of the tile.
 * @param {number} hgap The horizontal gap between tiles.
 * @param {number} vgap The vertical gap between tiles.
 * @returns {Array} An array of positions for the tiles.
 */
export const resetGame = async (
  SupabaseClient,
  groups,
  tiles,
  tileSize,
  hgap,
  vgap
) => {
  const newTiles = await makeTiles(SupabaseClient, groups);

  const tilesSetArray = Array.from(tiles);
  const newTilesArray = Array.from(newTiles);

  // Keep the same tiles set as before, but replace the contents
  // (the buttons click events are tied to the tiles objects themselves)
  for (let i = 0; i < tilesSetArray.length; i++) {
    tilesSetArray[i].id = newTilesArray[i].id;
    tilesSetArray[i].term = newTilesArray[i].term;
    tilesSetArray[i].category = newTilesArray[i].category;
    tilesSetArray[i].groupSize = newTilesArray[i].groupSize;
    tilesSetArray[i].groupIndex = newTilesArray[i].groupIndex;

    // The buton tied to the tile stays the same, it's just the text that changes
    tilesSetArray[i].button.textContent =
      tilesSetArray[i].term + " " + tilesSetArray[i].groupSize;
    tilesSetArray[i].button.className = "tile";
    tilesSetArray[i].button.disabled = false;
  }

  // Create new positions array, because the number of rows may have changed
  // when the user completed groups
  const positions = makePositions(groups.length, groups[groups.length - 1]);

  shuffleBoard(tiles, positions, tileSize, hgap, vgap);

  return positions;
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
