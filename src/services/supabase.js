import { TOAST_ERROR } from "../components/toasts";

/**
 * Fetch categories from the DB.
 * @param {number} num Number of categories to fetch.
 * @returns {Array} An array of num categories or an empty array if an error occurs.
 */
export const fetchCategories = async (client, num) => {
  const { data: categories, error } = await client
    .from("random_categories")
    .select("*")
    .limit(num);

  if (error) {
    console.error("Error fetching categories:", error);
    TOAST_ERROR.showToast();

    return [];
  }

  return categories;
};

/**
 * Fetch terms from the DB.
 * @param {number} categoryId The category ID.
 * @param {number} num Number of terms to fetch.
 * @returns {Array} An array of num terms or an empty array if an error occurs.
 */
export const fetchTerms = async (client, categoryId, num, debug = false) => {
  const { data: terms, error } = await client
    .from("random_terms")
    .select("*")
    .eq("category_id", categoryId)
    .limit(num);

  if (error) {
    console.error("Error fetching terms:", error);
    TOAST_ERROR.showToast();

    return [];
  }

  return terms;
};
