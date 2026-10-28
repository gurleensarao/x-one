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


def call_gemini(prompt, temperature=0.7, max_tokens=2048):
    body = {
        "systemInstruction": {"parts": [{"text": SHARED_RULES}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
            "maxOutputTokens": max_tokens,
        },
    }
    r = httpx.post(
        URL,
        headers={"x-goog-api-key": API_KEY, "Content-Type": "application/json"},
        json=body,
        timeout=60,
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


# ---------- Goals and quests ----------
class GoalRefused(Exception):
    pass


PROMPT_GOALS = """Profile: {{profile_summary}}
Chosen path: {{chosen_path}} (A = stay and grow where they are, B = step and explore new roles)
Their first move: {{first_move_title}}

Suggest exactly 3 REAL-LIFE goals this person could pursue over the next few weeks.
Each goal must be concrete and achievable, fit their constraints, and follow from the path they chose.
Make the three goals different from each other (for example: a skill, a project, an opportunity).

Return JSON with exactly this key:
goals (a list of 3 objects, each with title (8 words or fewer) and why (one sentence, 20 words or fewer))"""

PROMPT_QUEST = """Person: {{name}}
Profile: {{profile_summary}}
Skills: {{skills}}
Chosen path: {{chosen_path}} (A = stay and grow, B = step and explore)
Goal: {{goal}}

Design a REAL-WORLD mission chain for this goal. These are real actions in their real life, not fiction or a game story.
Rules:
- Use as many levels as the goal truly needs, between 4 and 6. Do not pad.
- Each level builds on the one before and is harder than the last.
- Level 1 must be a micro-mission doable in 10 to 15 minutes.
- Use imperative instructions (Do this, Write that). Do not use "might" or "could" here.
- Each level has an objective (one sentence), 2 to 4 concrete instructions, and 0 to 2 resources.
- A resource is a label plus a search phrase for a web search. NEVER write a URL.
- Evidence must match the task. Use "link" for a project, repository, document or page they can share by link. Use "reflection" for planning, learning or conversations (written text). Use "checklist" for simple actions such as sending an email. Do not demand a certificate unless the task is a course that issues one.
- xp: a whole number from 50 to 300, rising with difficulty. minutes: a realistic whole number.
- Do not include a final "advance" level. The app adds it.
- No real company, school or person names.
- If the goal involves harming anyone, self-harm or anything illegal, return {"refused": true} and nothing else.

Return JSON with exactly these keys:
goal (the goal in 10 words or fewer), title (a short quest title),
levels (a list of objects, each with: title, minutes, xp, objective, instructions (list of strings),
resources (list of objects with label and search), evidence (object))
The evidence object has: kind ("link", "reflection" or "checklist"), prompt (what to submit, one sentence),
and then for "reflection" a min_chars number (80 to 200), for "link" a link_hint string like "https://...",
for "checklist" an items list of 2 to 4 short strings."""


def _int(value, low, high, default):
    try:
        n = int(float(value))
    except Exception:
        n = default
    return max(low, min(high, n))


def _texts(items, limit, maxlen):
    if not isinstance(items, list):
        return []
    return [str(t).strip()[:maxlen] for t in items if str(t).strip()][:limit]


def clean_quest(data):
    """Check the AI's quest and rebuild it in the exact shape the app expects."""
    if data.get("refused"):
        raise GoalRefused("goal not supported")
    levels = data.get("levels")
    if not isinstance(levels, list) or not (3 <= len(levels) <= 7):
        raise ValueError("bad level count")

    out = []
    for i, lv in enumerate(levels[:6], start=1):
        ev = lv.get("evidence") or {}
        kind = ev.get("kind")
        if kind not in ("link", "reflection", "checklist"):
            raise ValueError("bad evidence kind")
        evidence = {"kind": kind, "prompt": str(ev.get("prompt", "Submit your evidence."))[:200]}
        if kind == "reflection":
            evidence["min_chars"] = _int(ev.get("min_chars"), 60, 250, 100)
        elif kind == "link":
            evidence["link_hint"] = "https://..."
        else:
            items = _texts(ev.get("items"), 4, 80)
            if len(items) < 2:
                raise ValueError("checklist needs items")
            evidence["items"] = items

        resources = []
        for r in (lv.get("resources") or [])[:2]:
            if isinstance(r, dict) and r.get("label") and r.get("search"):
                resources.append({"label": str(r["label"])[:80], "search": str(r["search"])[:100]})

        instructions = _texts(lv.get("instructions"), 4, 200)
        if not lv.get("title") or not lv.get("objective") or len(instructions) < 2:
            raise ValueError("level incomplete")

        out.append({
            "id": "l" + str(i), "number": i, "type": "step",
            "title": str(lv["title"])[:60],
            "minutes": _int(lv.get("minutes"), 5, 600, 30),
            "xp": _int(lv.get("xp"), 50, 300, 100),
            "objective": str(lv["objective"])[:200],
            "instructions": instructions,
            "resources": resources,
            "evidence": evidence,
        })

    n = len(out) + 1
    out.append({
        "id": "l" + str(n), "number": n, "type": "advance", "title": "Advance",
        "minutes": 0, "xp": 0, "placeholder": True,
        "objective": "Unlocks after your last mission: a harder mission chosen from how it went.",
        "instructions": [], "resources": [], "evidence": {"kind": "none", "prompt": ""},
    })
    return {"goal": str(data.get("goal", ""))[:100], "title": str(data.get("title", ""))[:80], "levels": out}


def generate_goals(profile_summary, chosen_path, first_move_title):
    prompt = fill(PROMPT_GOALS, {
        "profile_summary": profile_summary,
        "chosen_path": chosen_path,
        "first_move_title": first_move_title,
    })
    last = None
    for _ in range(2):
        try:
            data = call_gemini(prompt, 0.8)
            goals = data["goals"]
            if not isinstance(goals, list) or len(goals) < 3:
                raise ValueError("need 3 goals")
            return {"goals": [{"title": str(g["title"])[:70], "why": str(g["why"])[:160]} for g in goals[:3]]}
        except Exception as e:
            last = e
    raise RuntimeError("AI call failed: " + str(last))


def generate_quest(name, profile_summary, skills, chosen_path, goal):
    prompt = fill(PROMPT_QUEST, {
        "name": name, "profile_summary": profile_summary, "skills": skills,
        "chosen_path": chosen_path, "goal": goal,
    })
    last = None
    for _ in range(2):
        try:
            return clean_quest(call_gemini(prompt, 0.7, max_tokens=4096))
        except GoalRefused:
            raise
        except Exception as e:
            last = e
    raise RuntimeError("AI call failed: " + str(last))
