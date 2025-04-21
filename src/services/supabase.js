/**
 * Get a given number of distinct tags.
 * @param {SupabaseClient} client The Supabase client.
 * @param {number} numTags The number of tags to retrieve.
 * @returns {Array} An array of tags.
 */
export const getTags = async (client, numTags) => {
  let { data, error } = await client.rpc("get_random_distinct_tags", {
    n: numTags,
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
