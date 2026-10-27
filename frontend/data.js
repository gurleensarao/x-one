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