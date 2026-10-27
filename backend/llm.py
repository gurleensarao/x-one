import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent"

SHARED_RULES = """You are the story engine for X-one, a career self-reflection app.
Rules:
- Show POSSIBILITIES, never predictions. Use "might", "could", "imagine".
- Stay balanced: every path has a real upside AND a real challenge.
- Never tell the user which path is better.
- Respect the user's stated constraints (notice period, health routine, remote work, pay worries).
- Give no financial, legal or medical advice. Do not name real companies or people.
- Warm, simple English. Address the user as "you".
- If the user shares bitter or negative views about colleagues or employers, acknowledge the feeling gently. Do not repeat or amplify blame, and do not generalise about groups of people.
- Reply with ONLY valid JSON with exactly the keys requested. No extra text, no markdown fences."""

PROMPT_1 = """Person: {{name}}, {{age}}, {{qualification}}.
Current job: {{job}}
Skills: {{skills}}
What work has taught them: {{work_learned}}
What they want to change: {{work_challenge}}
What blocks their next move: {{blockers}}. {{custom_blocker}}

Task:
1. Write a neutral profile summary of 2 to 4 sentences. Include their constraints (such as notice period, routine, remote work). It will be reused as context later.
2. Write one personalised line for each path, 18 words or fewer each.
   Path A "Stay and Rewrite" = grow within their current role.
   Path B "Step & Explore" = explore new roles using their skills.

Return JSON with exactly these keys: profile_summary, path_a_description, path_b_description"""

PROMPT_2 = """Profile: {{profile_summary}}
Job: {{job}}
Skills: {{skills}}

Write an imagined "six months later" scene for EACH path.
Path A = stay and grow where they are. Path B = step into something new.

For each path give:
- headline: a short poetic phrase, 6 words or fewer
- scene: 45 to 65 words, starting with "Imagine", using "might" or "could"
- upside: one short line, 10 words or fewer
- challenge: one honest line, 20 words or fewer
Do not say either path is better. Reflect their real constraints in both scenes.

Also give:
- path_a_line: one personalised line for Path A, 22 words or fewer
- path_b_line: one personalised line for Path B, 22 words or fewer
- reflection_question: one gentle question helping them notice which trade-off feels easier to accept. Do not recommend a path.

Return JSON with exactly these keys:
path_a (object with headline, scene, upside, challenge),
path_b (object with headline, scene, upside, challenge),
path_a_line, path_b_line, reflection_question"""

PROMPT_4 = """Person: {{name}}
Chosen path: {{chosen_path}} (A = stay and grow, B = step and explore)
Profile: {{profile_summary}}
Their imagined scene: {{chosen_scene}}

Suggest ONE small first move they can do this week. It must be specific, low-risk and fit their constraints (for example, a notice period means no resigning).
Include a ready-to-send message in their voice, 40 words or fewer.
Use placeholders like [Manager] or [Name] instead of inventing names.

Return JSON with exactly these keys: greeting_line, move_label (2 to 3 words), title, description (1 to 2 sentences), minutes (a number), opening_line, reassurance (10 words or fewer)"""


def fill(template, values):
    for key, val in values.items():
        if isinstance(val, list):
            val = ", ".join(str(v) for v in val)
        template = template.replace("{{" + key + "}}", str(val))
    return template


def call_gemini(prompt, temperature=0.7):
    body = {
        "systemInstruction": {"parts": [{"text": SHARED_RULES}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
            "maxOutputTokens": 2048,
        },
    }
    r = httpx.post(
        URL,
        headers={"x-goog-api-key": API_KEY, "Content-Type": "application/json"},
        json=body,
        timeout=40,
    )
    r.raise_for_status()
    parts = r.json()["candidates"][0]["content"]["parts"]
    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def ask(prompt, required, temperature=0.7):
    """Call Gemini, check the JSON has the required keys, retry once."""
    last_error = None
    for _ in range(2):
        try:
            data = call_gemini(prompt, temperature)
            for key, sub in required.items():
                if key not in data:
                    raise ValueError("missing key: " + key)
                for subkey in sub:
                    if subkey not in data[key]:
                        raise ValueError("missing key: " + key + "." + subkey)
            return data
        except Exception as e:
            last_error = e
    raise RuntimeError("AI call failed: " + str(last_error))


SCENE_KEYS = ["headline", "scene", "upside", "challenge"]


def generate_story(inputs):
    """Screens 4, 5 and 6: path descriptions, scenes, reflection."""
    p1 = ask(
        fill(PROMPT_1, inputs),
        {"profile_summary": [], "path_a_description": [], "path_b_description": []},
    )
    p2 = ask(
        fill(PROMPT_2, {
            "profile_summary": p1["profile_summary"],
            "job": inputs.get("job", ""),
            "skills": inputs.get("skills", []),
        }),
        {"path_a": SCENE_KEYS, "path_b": SCENE_KEYS,
         "path_a_line": [], "path_b_line": [], "reflection_question": []},
        temperature=0.8,
    )
    return {
        "prompt1": p1,
        "prompt2": {"path_a": p2["path_a"], "path_b": p2["path_b"]},
        "prompt3": {
            "path_a_line": p2["path_a_line"],
            "path_b_line": p2["path_b_line"],
            "reflection_question": p2["reflection_question"],
        },
    }


def generate_first_move(name, chosen_path, profile_summary, chosen_scene):
    """Screen 7: the first move."""
    return ask(
        fill(PROMPT_4, {
            "name": name,
            "chosen_path": chosen_path,
            "profile_summary": profile_summary,
            "chosen_scene": chosen_scene,
        }),
        {"greeting_line": [], "move_label": [], "title": [], "description": [],
         "minutes": [], "opening_line": [], "reassurance": []},
    )
