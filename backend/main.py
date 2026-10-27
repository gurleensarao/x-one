from datetime import date
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import llm

app = FastAPI(title="X-one API")

# Lets the frontend (a different address) talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safety counter: after this many AI runs in a day, the app serves the fallback story
DAILY_LIMIT = 100
usage = {"day": date.today().isoformat(), "count": 0}


def check_budget():
    today = date.today().isoformat()
    if usage["day"] != today:
        usage["day"] = today
        usage["count"] = 0
    if usage["count"] >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="Daily AI limit reached")
    usage["count"] += 1


class StoryRequest(BaseModel):
    name: str = ""
    age: str = ""
    qualification: str = ""
    job: str = ""
    skills: List[str] = []
    work_learned: str = ""
    work_challenge: str = ""
    blockers: List[str] = []
    custom_blocker: str = ""


class FirstMoveRequest(BaseModel):
    name: str = ""
    chosen_path: str = "A"
    profile_summary: str = ""
    chosen_scene: str = ""


@app.get("/health")
def health():
    return {"status": "ok", "ai_runs_today": usage["count"]}


@app.post("/api/story")
def story(req: StoryRequest):
    check_budget()
    inputs = req.model_dump()
    # Keep long text under control
    for key in ("job", "work_learned", "work_challenge", "custom_blocker"):
        inputs[key] = inputs[key][:800]
    try:
        return llm.generate_story(inputs)
    except Exception as e:
        raise HTTPException(status_code=502, detail="AI unavailable: " + str(e)[:200])


@app.post("/api/first-move")
def first_move(req: FirstMoveRequest):
    check_budget()
    try:
        return llm.generate_first_move(
            req.name[:60], req.chosen_path, req.profile_summary[:1200], req.chosen_scene[:1200]
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail="AI unavailable: " + str(e)[:200])
