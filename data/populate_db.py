from supabase import create_client, Client
from dotenv import load_dotenv
from postgrest.exceptions import APIError
import os
import requests

DATA_PATH = "data.txt"

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def insert_data(line: str):
    category, terms = line.split("->")

    category = category.strip().lower()
    terms = [term.strip().lower() for term in terms.split(", ")]
    i = -1

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
    except APIError as e:
        if i < 0:
            print(f'error inserting riddle "{category}": {e.message}')
        else:
            print(f'error inserting term "{terms[i]}": {e.message}')


def main():
    with open(DATA_PATH, "r") as data_file:
        i = 0
        for line in data_file:
            print(i)
            insert_data(line)
            i += 1


if __name__ == "__main__":
    main()
