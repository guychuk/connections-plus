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

        const tags = await getTags(supabase, numTags, language);
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

        const categories = await getCategories(supabase, tags, minTerms);
        return res.status(200).json(categories);
      }
      case "getCategoryName": {
        const { categoryID } = params;

        if (!categoryID) {
          return res
            .status(400)
            .json({ message: "Missing categoryID parameter" });
        }

        const categoryName = await getCategoryName(supabase, categoryID);
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

        const terms = await getTerms(supabase, categoryID, num);
        return res.status(200).json(terms);
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
export const getTags = async (client, numTags, language) => {
  let { data, error } = await client.rpc("get_random_distinct_tags", {
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
export const getCategories = async (client, tags, minTerms) => {
  let { data, error } = await client.rpc("get_categories", {
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
export const getCategoryName = async (client, categoryID) => {
  let { data, error } = await client
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
export const getTerms = async (client, categoryID, num) => {
  let { data, error } = await client
    .from("terms")
    .select("*")
    .eq("category_id", categoryID)
    .limit(num);

  return error ? [] : data;
};
