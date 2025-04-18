export const getTags = async (client, numTags) => {
  let { data, error } = await client.rpc("get_random_distinct_tags", {
    n: numTags,
  });

  return error ? [] : data;
};

export const getCategories = async (client, tags, minTerms) => {
  let { data, error } = await client.rpc("get_categories", {
    tag_filter: tags,
    min_terms: minTerms,
  });

  return error ? [] : data;
};

export const getCategoryName = async (client, categoryID) => {
  let { data, error } = await client
    .from("categories")
    .select("*")
    .eq("id", categoryID);

  return error ? "" : data[0].category;
};

export const getTerms = async (client, categoryID, num) => {
  let { data, error } = await client
    .from("terms")
    .select("*")
    .eq("category_id", categoryID)
    .limit(num);

  return error ? [] : data;
};
