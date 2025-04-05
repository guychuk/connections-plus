/**
 * @file gameLogic.js
 * @description This file contains the game logic for the almost game.
 * It includes functions for selecting tiles, checking selections, and fetching riddles.
 * It also includes functions for initializing a new game and asserting the game configuration.
 */

import gameConfig from "../config/gameConfig.json";
import { gameCanvas } from "../config/canvasConfig.json";
import {
  hashTilesSet,
  shuffleArray,
  assert,
  sum,
  getRandomNums,
} from "./utils.js";
import { fetchRiddles } from "./supabase.js";

/**
 * Select a tile and update the selected tiles set.
 * @param {Number} tileIndex - The index of the tile to select on the board.
 * @param {Array} tiles - The array of tiles.
 * @param {Set} selectedTiles - The set of selected tiles.
 * @param {Boolean} debug - The debug flag (default: false).
 */
export function selectTile(tileIndex, tiles, selectedTiles, debug = false) {
  if (tileIndex === -1) {
    return;
  }
  if (selectedTiles.has(tiles[tileIndex])) {
    selectedTiles.delete(tiles[tileIndex]);
  }
  // If the tile is not in an already completed group
  else if (!tiles[tileIndex].completed) {
    const maxGroupSize = Math.max(...gameConfig["groups"]);

    if (selectedTiles.size === maxGroupSize) {
      if (debug) {
        console.log(`cannot choose more than ${maxGroupSize} tiles`);
      }
    } else {
      selectedTiles.add(tiles[tileIndex]);
    }
  }
}

/**
 * Check if the selected tiles are correct and update the game state accordingly.
 * @param {Set} selectedTiles - The set of selected tiles.
 * @param {Map<number, Array>} completedGroups - The set of completed groups.
 * @param {Set} prevSelections - The set of previous selections.
 * @param {Boolean} debug - The debug flag (default: false).
 * @return {Boolean} - Returns true if the game is over, false otherwise.
 */
export function checkSelection(
  selectedTiles,
  completedGroups,
  prevSelections,
  debug = false
) {
  const numOfSelections = selectedTiles.size;

  if (numOfSelections < Math.min(...gameConfig["groups"])) {
    console.error("not enogh selected");
  } else if (completedGroups.has(numOfSelections)) {
    console.error("you alredy solved this group size");
  } else {
    // Count the number of tiles which their group size
    // is the same as the selected number of tiles

    let counter = 0;

    for (const tile of selectedTiles) {
      if (tile.group === numOfSelections) {
        counter++;
      }
    }

    // All selected tiles are correct belong to the same group and the group size
    // is the same as the number of selected tiles -
    // the user figured out the riddle
    if (counter == numOfSelections) {
      console.log("correct:", selectedTiles.values().next().value.riddle);

      for (const tile of selectedTiles) {
        tile.completed = true;
      }

      completedGroups.set(numOfSelections, [...selectedTiles]);

      selectedTiles.clear();

      // The user figured out all riddles, the game is over
      if (completedGroups.size === gameConfig["groups"].length) {
        console.log("WINNER!");
        return true;
      }
    } else {
      const hash = hashTilesSet(selectedTiles);

      if (prevSelections.has(hash)) {
        console.log("you already tried that");
      } else {
        prevSelections.add(hash);

        if (2 * counter > numOfSelections) {
          console.log(`incorrect: ${counter}/${numOfSelections}`);
        } else {
          console.log(`incorrect`);
        }
      }
    }
  }

  return false;
}

/**
 * Get words from fetched riddles.
 * @param {Array} riddles an array of fetched riddles.
 * @param {Boolean} shuffle whether to shuffle the returned array (default: true).
 * @returns array of almost-tiles for the board.
 */
export function chooseWords(riddles, shuffle = true) {
  const words = [];
  const groups = gameConfig["groups"];
  const wordsInRiddle = Object.keys(riddles[0]).length - 2; // Exclude the riddle/id fields

  riddles.forEach((riddle, index) => {
    // Get random indices for the words in the riddle
    const indices = getRandomNums(wordsInRiddle, groups[index]);

    indices.forEach((i) => {
      // Add new fields to almost form a tile
      words.push({
        group: groups[index],
        riddle: riddle["riddle"],
        word: riddle[`word_${i}`],
      });
    });
  });

  if (shuffle) {
    shuffleArray(words);
  }

  return words;
}

/**
 * Fetch riddles from the database and return them.
 * @returns {Array} an array of riddles.
 * @async
 */
export async function getTilesForANewGame() {
  const riddles = await fetchRiddles(gameConfig["groups"].length);
  const tiles = chooseWords(riddles);

  return Array.from(tiles, (tile, index) => {
    // Add new fields to form a tile
    tile.completed = false;
    tile.id = index;
    return tile;
  });
}

/**
 * Initialize a new game.
 * @param {Set} selectedTiles - The set of selected tiles.
 * @param {Set} prevSelections - The set of previous selections.
 * @param {Map<number, Array>} completedGroups - The set of completed groups.
 * @return {Array} - Returns the new tiles for the game.
 * @async
 */
export async function newGame(selectedTiles, prevSelections, completedGroups) {
  selectedTiles.clear();
  prevSelections.clear();
  completedGroups.clear();

  const tiles = await getTilesForANewGame();

  return tiles;
}

/**
 * Assert the game configuration.
 * @throws {Error} If the number of tiles does not match the sum of group sizes.
 */
export function assertGameConfig() {
  const groups = gameConfig["groups"];

  assert(
    gameCanvas["rows"] * gameCanvas["cols"] === sum(groups),
    "wrong number of tiles"
  );
}
