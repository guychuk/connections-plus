CREATE OR REPLACE FUNCTION get_random_distinct_tags(n integer, lang text)
RETURNS SETOF tags AS $$
BEGIN
  RETURN QUERY
  WITH distinct_tags AS (
    SELECT DISTINCT ON (tag) *
    FROM tags
    WHERE language = lang
  )
  SELECT *
  FROM distinct_tags
  ORDER BY random()
  LIMIT n;
END;
$$ LANGUAGE plpgsql;