from supabase import create_client, Client
from dotenv import load_dotenv
import os
import re
from tqdm import tqdm

DATA_PATH = "categories_heb.txt"
LANGUAGE = "Hebrew"
ERRORS_PATH = "errors.txt"

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def insert_data(line: str):
    """
    Insert a line of data into the database.

    Args:
        line: a string in the format "[tags] category -> terms"

    Returns:
        None if the data was inserted successfully, otherwise an error message

    Raises:
        Exception: if there is an error inserting the data
    """

    tags, category, terms = parse_line(line)

    if not tags or not category or not terms:
        return f"Error parsing line: {line}"

    i = -1
    j = -1

    try:
        response = supabase.table("categories").insert({"category": category}).execute()
        category_id = response.data[0]["id"]

        for term in terms:
            i += 1
            response = (
                supabase.table("terms")
                .insert({"term": term, "category_id": category_id})
                .execute()
            )

        for tag in tags:
            j += 1
            response = (
                supabase.table("tags")
                .insert({"tag": tag, "category_id": category_id, "language": LANGUAGE})
                .execute()
            )
    except Exception as e:
        if i < 0:
            return f"Error inserting category {category}: {e}"
        elif j < 0:
            return f"Error inserting term for category {terms[i]}: {e}"
        else:
            return f"Error inserting tag for category {tags[j]}: {e}"

    return None


def parse_line(line: str):
    """Parses a line from the dataset file into a tuple of tags, category, and terms.

    The line is expected to be in the format:
        [tags] category -> terms

    Where tags are comma-separated and terms are comma-separated.
    """

    cleaned = re.sub(r"\([^)]*\)", "", line)
    match = re.match(r"\[(.*?)\]\s*(\S.*?\S)\s*->\s*(.*)\s*", cleaned)

    if match:
        tags = [tag.strip().lower() for tag in match.group(1).split(",")]
        category = match.group(2).strip().lower()
        terms = [term.strip().lower() for term in match.group(3).split(",")]

        return tags, category, terms
    else:
        return [], "", []


def main():
    bad_lines = 0

    with open(DATA_PATH, "r", encoding="utf-8") as data_file, open(
        ERRORS_PATH, "w", encoding="utf-8"
    ) as errors_file:
        bar = tqdm(data_file.readlines())
        bar.set_postfix(bad_lines=bad_lines)

        for line in bar:
            if line.strip() == "":
                continue

            err = insert_data(line.strip())

            if err:
                errors_file.write(f"{err}\n")
                bad_lines += 1
                bar.set_postfix(bad_lines=bad_lines)


if __name__ == "__main__":
    main()
