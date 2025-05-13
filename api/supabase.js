import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    const { action, ...params } = req.query;

    switch (action) {
      case "getTags": {
        const { numTags, language } = params;

        if (!numTags) {
          return res.status(400).json({ message: "Missing numTags parameter" });
        } else if (!language) {
          return res
            .status(400)
            .json({ message: "Missing language parameter" });
        }

        const tags = await getTags(numTags, language);
        return res.status(200).json(tags);
      }
      case "getCategories": {
        const { tags, minTerms } = params;

        if (!tags) {
          return res.status(400).json({ message: "Missing tags parameter" });
        } else if (!minTerms) {
          return res
            .status(400)
            .json({ message: "Missing minTerms parameter" });
        }

        const parsedTags = JSON.parse(decodeURIComponent(tags));

        const categories = await getCategories(parsedTags, minTerms);
        return res.status(200).json(categories);
      }
      case "getCategoryName": {
        const { categoryID } = params;

        if (!categoryID) {
          return res
            .status(400)
            .json({ message: "Missing categoryID parameter" });
        }

        const categoryName = await getCategoryName(categoryID);
        return res.status(200).json(categoryName);
      }
      case "getTerms": {
        const { categoryID, num } = params;

        if (!categoryID) {
          return res
            .status(400)
            .json({ message: "Missing categoryID parameter" });
        } else if (!num) {
          return res.status(400).json({ message: "Missing num parameter" });
        }

        const terms = await getTerms(categoryID, num);
        return res.status(200).json(terms);
      }
      case "tiles": {
        const { groupsSizes, numTags, language } = params;

        if (!groupsSizes) {
          return res
            .status(400)
            .json({ message: "Missing groupsSizes parameter" });
        } else if (!numTags) {
          return res.status(400).json({ message: "Missing numTags parameter" });
        } else if (!language) {
          return res
            .status(400)
            .json({ message: "Missing language parameter" });
        }

        const parsedGroupsSizes = JSON.parse(decodeURIComponent(groupsSizes));

        const tiles = await getTiles(parsedGroupsSizes, numTags, language);

        if (!tiles)
          return res.status(500).json({ message: "Failed to get tiles" });

        return res.status(200).json(tiles);
      }
      default:
        return res.status(400).json({ message: "Invalid action parameter" });
    }
  } else {
    res.status(405).json({ message: "Invalid request method" });
  }
}

/**
 * Get a given number of distinct tags.
 * @param {SupabaseClient} client The Supabase client.
 * @param {number} numTags The number of tags to retrieve.
 * @returns {Array} An array of tags.
 */
export const getTags = async (numTags, language) => {
  let { data, error } = await supabase.rpc("get_random_distinct_tags", {
    n: numTags,
    lang: language,
  });

  return error ? [] : data;
};

/**
 * Retrieve categories that match a given set of tags and have at least a minimum number of terms.
 * @param {SupabaseClient} client The Supabase client.
 * @param {Array} tags An array of tags to filter categories.
 * @param {number} minTerms The minimum number of terms a category must have.
 * @returns {Array} An array of categories matching the criteria.
 */
export const getCategories = async (tags, minTerms) => {
  let { data, error } = await supabase.rpc("get_categories", {
    tag_filter: tags,
    min_terms: minTerms,
  });

  return error ? [] : data;
};

/**
 * Get the name of a category given its id.
 * @param {SupabaseClient} client The Supabase client.
 * @param {number} categoryID The id of the category.
 * @returns {string} The name of the category, or an empty string on error.
 */
export const getCategoryName = async (categoryID) => {
  let { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryID);

  return error ? "" : data[0].category;
};

/**
 * Retrieve a specified number of terms for a given category.
 * @param {SupabaseClient} client The Supabase client.
 * @param {number} categoryID The ID of the category whose terms are to be retrieved.
 * @param {number} num The maximum number of terms to retrieve.
 * @returns {Array} An array of terms, or an empty array on error.
 */
export const getTerms = async (categoryID, num) => {
  let { data, error } = await supabase
    .from("terms")
    .select("*")
    .eq("category_id", categoryID)
    .limit(num);

  return error ? [] : data;
};

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
 * Get tiles for a new game.
 * @param {Array} groups array of group sizes.
 * @param {number} numTags The number of tags to retrieve.
 * @returns {Set} set of tiles.
 */
export const getTiles = async (groupsSizes, numTags, language) => {
  const numGroups = groupsSizes.length;

  var categories;
  const categoriesSet = new Set();

  var iterations = 0;

  while (iterations < 30) {
    const tags = (await getTags(numTags, language)).map((tag) => tag.tag);

    let i = numGroups;

    categories = Array.from({ length: numGroups }, () => null);
    categoriesSet.clear();

    // Test this choice of Tags
    while (0 < i) {
      const newCategories = (
        await getCategories(tags, groupsSizes[i - 1])
      ).filter((category) => !categoriesSet.has(category.cat_id));

      // If no categories were found, try again with different tags
      if (newCategories.length === 0) {
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
      getCategoryName(category.cat_id)
    );

    const categoriesNames = await Promise.all(categoriesNamesPromises);

    // Get terms

    const fetchTermsPromises = groupsSizes.map((groupSize, index) =>
      supabase.getTerms(categories[index].cat_id, groupSize).then((terms) => {
        return terms.map((term) => term.term);
      })
    );

    const allTerms = await Promise.all(fetchTermsPromises);

    // Check for duplicate terms
    if (new Set(allTerms.flat()).size !== allTerms.flat().length) {
      iterations++;
      continue;
    }

    const tiles = [];

    for (let i = 0; i < groupsSizes.length; i++) {
      for (let j = 0; j < groupsSizes[i]; j++) {
        tiles.push(
          makeTile(
            tiles.length, // id
            allTerms[i][j], // term
            categoriesNames[i], // category
            groupsSizes[i], // groupSize
            i, // groupIndex
            null // button (not yet created)
          )
        );
      }
    }

    return tiles;
  }
};
