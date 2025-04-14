/**
 * Fetch categories from the DB.
 * @param {number} num umber of categories to fetch.
 * @param {boolean} debug whether to log debug information.
 * @returns an array of num categories.
 */
export const fetchCategories = async (client, num, debug = false) => {
  const { data: categories, error } = await client
    .from("random_categories")
    .select("*")
    .limit(num);

  if (error) {
    console.error("error fetching categories:", error);
    return [];
  }

  if (debug) {
    console.log(`Fetched ${categories.length} categories`);
  }

  return categories;
};

/**
 * Fetch terms from the DB.
 * @param {number} categoryId the category id.
 * @param {number} num number of terms to fetch.
 * @param {boolean} debug whether to log debug information.
 * @returns an array of num terms.
 */
export const fetchTerms = async (client, categoryId, num, debug = false) => {
  const { data: terms, error } = await client
    .from("random_terms")
    .select("*")
    .eq("category_id", categoryId)
    .limit(num);

  if (error) {
    console.error("error fetching terms:", error);
    return [];
  }

  if (debug) {
    console.log(`Fetched ${terms.length} terms for category ${categoryId}`);
  }

  return terms;
};
