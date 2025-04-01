from supabase import create_client, Client
from dotenv import load_dotenv
from postgrest.exceptions import APIError
import os

RIDDLES_PATH = "data/riddles.txt"

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_riddle(line: str):
    riddle, words = line.split('->')

    riddle = riddle.strip().lower()
    words = [word.strip().lower() for word in words.split(', ')]

    riddle_entry = {
        "riddle": riddle,
        "word_1": words[0],
        "word_2": words[1],
        "word_3": words[2],
        "word_4": words[3],
        "word_5": words[4],
        "word_6": words[5],
    }

    try:
        supabase.table("riddles").insert(riddle_entry).execute()
        print(f'inserted riddle "{riddle}"')
    except APIError as e:
        print(f'error inserting riddle "{riddle}": {e.message}')    

def main():
    with open(RIDDLES_PATH, 'r') as riddles_file:
        for riddle in riddles_file:
            insert_riddle(riddle)

if __name__ == "__main__":
    main()
