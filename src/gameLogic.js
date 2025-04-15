import { fetchCategories, fetchTerms } from "./supabase";
import { shuffleArray } from "./utils";
import { calculateTileSize, createButtons } from "./ui";

/**
 * Make a tile object.
 * @param {string} id - The ID of the tile.
 * @param {string} term - The term of the tile.
 * @param {string} category - The category of the tile.
 * @param {number} groupSize - The group size of the tile.
 * @param {HTMLButtonElement} button - The button element for the tile.
 * @returns {Object} - The tile object.
 */
const makeTile = (id, term, category, groupSize, button) => {
  return {
    id,
    term,
    category,
    groupSize,
    button,
  };
};

/**
 * Create tiles for a new game.
 * @param {*} client supabase client.
 * @param {Array} groups array of group sizes.
 * @returns {Array} array of tiles.
 */
export const makeTiles = async (client, groups) => {
  const categories = await fetchCategories(client, groups.length);

  const fetchTermsPromises = groups.map((groupSize, index) =>
    fetchTerms(client, categories[index].id, groupSize)
  );

  const allTerms = await Promise.all(fetchTermsPromises);

  const tiles = [];

  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i]; j++) {
      tiles.push(
        makeTile(
          allTerms[i][j].id,
          allTerms[i][j].term,
          categories[i].category,
          groups[i],
          null
        )
      );
    }
  }

  return tiles;
};

/**
 * Initialize the game board with tiles.
 * @param {Object} client - The Supabase client.
 * @param {Array} groups - An array of group sizes.
 * @param {HTMLCanvasElement} board - The board element.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 * @returns {Object} An object containing the tiles, positions, tile size and selected buttons.
 */
export const initializeGame = async (client, groups, board, hgap, vgap) => {
  const rows = groups.length;
  const cols = groups[groups.length - 1];

  const tileSize = calculateTileSize(board, rows, cols, hgap, vgap);

  const positions = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      return {
        row,
        col,
      };
    })
  ).flat();

  const tiles = await makeTiles(client, groups);

  shuffleArray(positions);

  const selectedTiles = new Set();

  const selectedTilesObj = {
    selectedTiles,
    maxSelections: groups[groups.length - 1],
  };

  createButtons(
    board,
    positions,
    tiles,
    tileSize,
    hgap,
    vgap,
    selectedTilesObj
  );

  return { tiles, positions, tileSize, selectedTiles };
};
