import { fetchCategories, fetchTerms } from "./supabase";
import { shuffleArray } from "./utils";
import { calculateTileSize, createButtons, shuffleBoard } from "./ui";

/**
 * Make a tile object.
 * @param {string} id - The ID of the tile.
 * @param {string} term - The term of the tile.
 * @param {string} category - The category of the tile.
 * @param {number} groupSize - The group size of the tile.
 * @param {number} groupIndex - The group index of the tile.
 * @param {HTMLButtonElement} button - The button element for the tile.
 * @returns {Object} - The tile object.
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
 * @param {*} client supabase client.
 * @param {Array} groups array of group sizes.
 * @returns {Set} array of tiles.
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
          tiles.length,
          allTerms[i][j].term,
          categories[i].category,
          groups[i],
          i,
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

  const buttons = createButtons(
    board,
    positions,
    tiles,
    tileSize,
    hgap,
    vgap,
    selectedTiles,
    groups[groups.length - 1]
  );

  return { buttons, tiles, positions, tileSize, selectedTiles };
};

/**
 * Reset the game board with new tiles.
 * @param {Object} SupabaseClient - The Supabase client.
 * @param {Array} groups - An array of group sizes.
 * @param {Array} buttons - An array of button elements.
 * @param {Array} positions - An array of positions for the tiles.
 * @param {Object} tileSize - An object containing the height and width of the tile.
 * @param {number} hgap - The horizontal gap between tiles.
 * @param {number} vgap - The vertical gap between tiles.
 * @returns {Array} An array of (new) tile objects.
 */
export const resetGame = async (
  SupabaseClient,
  groups,
  buttons,
  positions,
  tileSize,
  hgap,
  vgap
) => {
  const tiles = await makeTiles(SupabaseClient, groups);

  let i = 0;

  for (let tile of tiles) {
    buttons[i].textContent = tile.term;
    buttons[i].classList.remove("selected");
    tile.button = buttons[i++];
  }

  shuffleBoard(buttons, positions, tileSize, hgap, vgap);

  return tiles;
};
