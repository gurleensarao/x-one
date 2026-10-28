// Aarav's fallback story (same shape the AI will return later)
const STORY = {
  prompt2: {
    path_a: {
      headline: "The familiar, with fresh challenge.",
      scene: "Imagine staying with your team, but proposing a small dashboard project that shows you can handle something new. Your manager might see your readiness, and you could begin shadowing a different client. Your skills could feel sharp again, and your gym and diet routine stay yours.",
      upside: "Fresh work. Trust already earned.",
      challenge: "Your manager may still hesitate. Change could depend on how clearly you show readiness."
    },
    path_b: {
      headline: "The unknown, on your terms.",
      scene: "Imagine spending your evenings sharpening one new skill and building a small project. You might start quiet conversations with companies that fit your goals, and talk openly about timing around your 90-day notice. Recognition and pay could feel different somewhere new, though your routine may need rebuilding.",
      upside: "Wider recognition. A chance at better pay.",
      challenge: "A 90-day notice and a new setup may test your energy and your healthy habits."
    }
  }
};
// ---------- Aarav's fallback: Screens 4, 6 and 7 ----------
STORY.prompt1 = {
  path_a_description: "Ask for a new client or project while keeping your routine and earned trust.",
  path_b_description: "Build fresh skills and explore roles that value your abilities, planned around your notice period."
};

STORY.prompt3 = {
  path_a_line: "Reshape your analyst career with new work, more trust and room to grow.",
  path_b_line: "Carry your analytics skills into new opportunities and find where they're valued most.",
  reflection_question: "Which challenge feels easier for you to live with six months from now?"
};

STORY.prompt4_path_a = {
  greeting_line: "Aarav, a little growth starts with a little ask.",
  move_label: "Start the conversation",
  title: "Ask for fifteen minutes.",
  description: "Open a conversation with your manager about a small project that shows you're ready for a new client. Send it by email, so there's a written trail.",
  minutes: 15,
  opening_line: "Hi [Manager], I've enjoyed our current client work and want to grow further. Could we spend 15 minutes this week discussing a small project that lets me show I'm ready for a new client?",
  reassurance: "You're opening a conversation, not demanding a change."
};

STORY.prompt4_path_b = {
  greeting_line: "Aarav, exploring starts with one small step.",
  move_label: "Look around quietly",
  title: "Message one person in your field.",
  description: "Ask someone in a role you're curious about how they got there. It costs nothing and doesn't touch your notice period.",
  minutes: 10,
  opening_line: "Hi [Name], I'm a data analyst exploring where my skills could grow. Could I ask you two quick questions about how you moved into your current role?",
  reassurance: "Curiosity isn't a commitment to leave."
};
// ---------- Aarav's quest (hand-written fallback for the mission game) ----------
const QUEST_FALLBACK = {
  goal: "Be the analyst trusted with a new client",
  title: "Become trusted with a new client",
  path: "A",
  levels: [
    {
      id: "l1", number: 1, type: "plan", title: "Pick your proof project", minutes: 10, xp: 100,
      objective: "Choose one small dashboard idea that would impress a new client's team.",
      instructions: [
        "Think of a business area you'd like to work on, such as sales, finance or operations.",
        "Write down three questions a dashboard for that area should answer.",
        "Pick one free public dataset to use."
      ],
      resources: [
        { label: "Free public datasets for Power BI practice", search: "free public datasets for Power BI practice" }
      ],
      evidence: { kind: "reflection", prompt: "Write your 3 questions and the dataset you picked.", min_chars: 120 }
    },
    {
      id: "l2", number: 2, type: "build", title: "Build the proof", minutes: 180, xp: 200,
      objective: "Build a one-page Power BI dashboard that answers your three questions.",
      instructions: [
        "Load your dataset and clean it with Power Query (M code).",
        "Write two or three DAX measures for your key numbers.",
        "Design one clear page, with a title that states the main finding."
      ],
      resources: [
        { label: "Power BI one-page dashboard design tips", search: "Power BI one page dashboard design best practices" },
        { label: "DAX measures for beginners", search: "Power BI DAX measures tutorial" }
      ],
      evidence: { kind: "link", prompt: "Paste a link to your dashboard: a published link, or a screenshot in Google Drive shared as 'anyone with the link'.", link_hint: "https://..." }
    },
    {
      id: "l3", number: 3, type: "showcase", title: "Tell the story", minutes: 45, xp: 150,
      objective: "Turn the dashboard into a short story a manager can read in two minutes.",
      instructions: [
        "Write three bullet points: the question, the finding and what to do about it.",
        "Add one line on the tools you used (Power Query, DAX).",
        "Save it as a one-page PDF or document."
      ],
      resources: [
        { label: "Data storytelling for business dashboards", search: "data storytelling for business dashboards" }
      ],
      evidence: { kind: "link", prompt: "Paste a link to your one-page summary.", link_hint: "https://..." }
    },
    {
      id: "l4", number: 4, type: "ask", title: "Ask in writing", minutes: 20, xp: 150,
      objective: "Email your manager to request a small project on a new client, with your proof attached.",
      instructions: [
        "Use the message from The First Move as your starting point.",
        "Attach or link your dashboard and your summary.",
        "Ask for a 15-minute call, and keep the email as your written trail."
      ],
      resources: [
        { label: "How to ask your manager for new responsibilities", search: "how to ask manager for new responsibilities email" }
      ],
      evidence: { kind: "checklist", prompt: "Tick what you've done.", items: ["I wrote the email", "I attached or linked my proof", "I sent it"] }
    },
    {
      id: "l5", number: 5, type: "opportunity", title: "Take the opportunity", minutes: 60, xp: 250,
      objective: "Take part in one new-client task, even a small one.",
      instructions: [
        "If the answer is yes, agree the first small task and a date.",
        "If the answer is not yet, ask what would make it a yes, and write it down.",
        "Do the task, or its first step."
      ],
      resources: [],
      evidence: { kind: "reflection", prompt: "What happened, and what did you learn? An honest 'not yet' counts too.", min_chars: 150 }
    },
    {
      id: "l6", number: 6, type: "advance", title: "Advance", minutes: 0, xp: 0, placeholder: true,
      objective: "Unlocks after Level 5: a harder mission chosen from how it went.",
      instructions: [], resources: [],
      evidence: { kind: "none", prompt: "" }
    }
  ]
};