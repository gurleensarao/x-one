# X-one (Exceptional Someone)

**Real-life progress, made into a game worth continuing.**

X-one helps someone at a career crossroads do two things:

1. **Explore what could be.** "Behind the Lines" shows imagined, clearly-labelled *possibilities* for two paths (never predictions).
2. **Do what is real.** They pick a real-life goal, get a personalised chain of missions, submit evidence of real progress, and unlock the next level.

> The main journey is about doing. Behind the Lines is about exploring what could be.

## Links
- **Live app:** https://xoneplottwist.netlify.app/
- **GitHub:** https://github.com/gurleensarao/x-one
- **Demo video:** <<FILL: paste your video link>>
- Backend API docs: https://x-one-api.onrender.com/docs

## Try it in 2 minutes
1. Open the live app. (The AI server sleeps when idle and wakes when the page opens, so the very first story can take up to a minute.)
2. Press **Start**, then **Try it with an example story (Aarav)**, and go through the screens.
3. On the last journey screen press **Start my quest**, make an avatar, pick a goal, and press **Build my quest**.
4. Open Level 1, submit your evidence, and watch the level unlock.

## The journey
1. **Character Sheet:** name, age, qualification, job, skills
2. **Plot-Twist Journal:** what work taught you, what needs changing, what blocks you
3. **Crossroads:** *Stay and Rewrite* or *Step & Explore*
4. **Behind the Lines:** AI-written "six months later" scenes
5. **Reflection & Insight:** which direction feels more like you
6. **The First Move:** one small action and a message you can copy
7. **Your avatar:** build a hero that grows as you progress
8. **Choose your quest:** 3 AI-suggested real-life goals, or type your own
9. **Journey map and missions:** each mission has an objective, steps, learning links and an evidence form; the next level stays locked until the evidence passes the checks
10. **MISSION COMPLETE!** celebration, XP, badges, and an avatar that evolves (aura, sparkles, cape, crown)

## How unlocking works (and what it does NOT do)
- Evidence must match the task: a **link** (project, document, repository), a **written reflection**, or a **checklist**.
- Simple checks run in the app: links must look like real web links, reflections need a minimum length, checklists must be fully ticked, and the same proof can't be reused for another mission.
- A failed check gives feedback and the user can resubmit. Locked levels can't be opened, and XP can't be earned twice.
- Accepted missions are labelled **"Accepted · self-confirmed"**.
- **Nothing is independently verified in this prototype.** There is no review backend. Links and reflections are checked for form, not truth.

## Tech stack
| Part | Tools |
|---|---|
| Frontend | HTML, CSS, JavaScript (no framework), hosted on Netlify |
| Backend | Python, FastAPI, Uvicorn, httpx, python-dotenv, hosted on Render (free plan) |
| AI model | Google Gemini (`gemini-3.5-flash-lite`) through the Gemini API |
| Storage | Browser `localStorage` only (no database, no accounts) |

```
Browser (Netlify)  ->  FastAPI on Render  ->  Gemini API  ->  validated JSON  ->  screens
```

If the AI is slow, unavailable or over its daily limit, the app falls back to a hand-written example story and quest (Aarav) and **says so on screen**.

## AI use (disclosure)
- **Claude (Anthropic)** was used as an AI assistant for planning, prompt design and code help while building this project. The author ran, tested and edited everything.
- **Gemini** writes the personalised content inside the app at run time (paths, scenes, goals, missions, first move).
- The mission AI never writes links: learning resources are shown as search phrases and opened as ordinary web searches.
- Fonts: Google Fonts (Cormorant Garamond, Inter).
- Artwork: The four background images were made, for example "generated and arranged in Figma", or the stock site and licence>>. The avatar is drawn in code (SVG) for this prototype.

## Responsible-AI choices
- Scenes are *possibilities, not predictions*, and say so on screen.
- Prompt rules: balanced paths, no financial/legal/medical advice, no real company or person names, gentle handling of bitter or negative text.
- AI replies are validated (required fields, allowed evidence types, XP and time ranges); one retry; then the fallback.
- If someone's text suggests they may be in distress, the app stops and shows a caring message with help-line information instead of generating content. (Keyword-based, so it is a basic safeguard, not a substitute for real support.)
- A daily AI-call limit protects the free quota. API keys live only in environment variables.

## Honest limitations
- Progress is stored only in the user's browser. Clearing data or switching device loses it.
- Evidence is self-confirmed and not verified by anyone.
- Render's free plan sleeps when idle, so the first request can take up to a minute. The page pings the server when it opens to wake it early.
- The distress check is keyword-based and covers English plus a few Hindi words.
- Avatar options are limited and drawn with simple shapes.
- Mission quality depends on the AI; the first level is always designed to be a short, doable step.

## Run it locally
**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
# create backend/.env  (see backend/.env.example)
python -m uvicorn main:app --reload
```

**Frontend:** open `frontend/index.html` in a browser. When opened from a file or from localhost it talks to your local backend automatically; anywhere else it talks to the Render backend.

**Environment variables** (names only)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default `gemini-3.5-flash-lite`)

## Project structure
```
x-one/
├── frontend/   index.html, style.css, app.js, data.js, avatar.js, safety.js, assets/
├── backend/    main.py (routes, daily limit), llm.py (prompts, Gemini call, validation), requirements.txt, .env.example
├── netlify.toml
└── README.md
```

## What's next
Accounts and a database, human or mentor review of evidence, verified integrations (for example GitHub), richer avatar art, reminders, and a "harder missions" level that adapts to how the last quest went.

## Author
Gurleen Kaur, first-semester B.Tech student, Chitkara University. Built for FirstHack 2026.
