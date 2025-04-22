CREATE OR REPLACE FUNCTION get_categories(min_terms INT, tag_filter TEXT[])
RETURNS TABLE(cat_id BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH tagged_terms AS (
        SELECT 
            tags.category_id, 
            terms.term, 
            tags.tag,
            COUNT(*) OVER (PARTITION BY terms.term) AS term_occurrences
        FROM tags
        JOIN terms ON tags.category_id = terms.category_id
        WHERE tags.tag = ANY(tag_filter)  -- Use ANY to filter by the array of tags
    )
    SELECT category_id AS cat_id
    FROM tagged_terms
    WHERE term_occurrences = 1
    GROUP BY category_id
    HAVING COUNT(DISTINCT term) >= min_terms;  
END;
$$ LANGUAGE plpgsql;