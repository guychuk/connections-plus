/**
 * Get a given number of distinct tags.
 * @param {number} numTags The number of tags to retrieve.
 * @returns {Array} An array of tags.
 */
export const getTags = async (numTags, language) => {
  const response = await fetch(
    `/api/supabase?action=getTags&numTags=${numTags}&language=${language}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  const tags = await response.json();
  return tags;
};

/**
 * Retrieve categories that match a given set of tags and have at least a minimum number of terms.
 * @param {Array} tags An array of tags to filter categories.
 * @param {number} minTerms The minimum number of terms a category must have.
 * @returns {Array} An array of categories matching the criteria.
 */
export const getCategories = async (tags, minTerms) => {
  const tagsParam = encodeURIComponent(JSON.stringify(tags));

  const response = await fetch(
    `/api/supabase?action=getCategories&tags=${tagsParam}&minTerms=${minTerms}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const categories = await response.json();
  return categories;
};

/**
 * Get the name of a category given its id.
 * @param {number} categoryID The id of the category.
 * @returns {string} The name of the category, or an empty string on error.
 */
export const getCategoryName = async (categoryID) => {
  const response = await fetch(
    `/api/supabase?action=getCategoryName&categoryID=${categoryID}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch category name: ${error.message}`);
  }

  const category = await response.json();
  return category;
};

/**
 * Retrieve a specified number of terms for a given category.
= * @param {number} categoryID The ID of the category whose terms are to be retrieved.
 * @param {number} num The maximum number of terms to retrieve.
 * @returns {Array} An array of terms, or an empty array on error.
 */
export const getTerms = async (categoryID, num) => {
  const response = await fetch(
    `/api/supabase?action=getTerms&categoryID=${categoryID}&num=${num}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch terms: ${error.message}`);
  }

  const terms = await response.json();
  return terms;
};
