import json
import llm

inputs = {
    "name": "Aarav",
    "age": 27,
    "qualification": "10+2 (Non-Medical), B.Tech CSE",
    "job": "Data analyst at a US-based company, working from home. Four years on the same client.",
    "skills": ["Data Analytics", "Power BI", "Advanced DAX", "Storytelling", "Excel + VBA", "Python"],
    "work_learned": "You are on your own. Everything needs written proof. You are expected to be flawless, even on your first try.",
    "work_challenge": "My client bothers me most. My skills are rusting on a simple client, and my managers do not seem confident enough to change it.",
    "blockers": ["Money", "No clear path", "Confidence"],
    "custom_blocker": "My 90-day notice period means other companies may not wait, and I fear losing my gym and diet routine.",
}

story = llm.generate_story(inputs)
print(json.dumps(story, indent=2, ensure_ascii=False))
