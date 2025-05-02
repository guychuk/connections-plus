import requests
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL or key not set in environment variables")


def handler(request):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.get(SUPABASE_URL, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Return successful response
        return {"statusCode": 200, "body": data}

    except requests.exceptions.RequestException as e:
        return {"statusCode": 500, "body": f"Request failed: {str(e)}"}
