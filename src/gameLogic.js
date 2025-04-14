import { fetchCategories, fetchTerms } from "./supabase";

/**
 * Create tiles for a new game.
 * @param {*} client supabase client.
 * @param {Array} groups array of group sizes.
 * @returns {Array} array of tiles.
 */
export const makeTiles = async (client, groups) => {
  const categories = await fetchCategories(client, groups.length);

  const tiles = [];

  for (let i = 0; i < groups.length; i++) {
    const termsInGroup = groups[i];
    const categoryId = categories[i].id;
    const categoryName = categories[i].category;

    const terms = await fetchTerms(client, categoryId, termsInGroup);

    for (let j = 0; j < termsInGroup; j++) {
      const term = terms[j].term;
      const tile = {
        id: tiles.length,
        term: term,
        category: categoryName,
        groupSize: groups[i],
      };

      tiles.push(tile);
    }
  }

  return tiles;
};
