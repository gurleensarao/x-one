import os, httpx
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
r = httpx.get("https://generativelanguage.googleapis.com/v1beta/models", params={"key": key, "pageSize": 100})
if r.status_code != 200:
    print("Error:", r.status_code, r.text[:200])
for m in r.json().get("models", []):
    if "generateContent" in m.get("supportedGenerationMethods", []):
        print(m["name"])
