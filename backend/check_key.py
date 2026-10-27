import os
from dotenv import load_dotenv

load_dotenv()
k = os.getenv("GEMINI_API_KEY")
print("length:", len(k) if k else None)
print("starts with:", k[:4] if k else None)
