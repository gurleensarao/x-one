// ---------- Screen switching ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.goto));
});

// ---------- App state (what the user chose) ----------
const state = { openPath: null, chosenPath: null, inputs: {} };

// Tap a blocker chip on/off
document.querySelectorAll("#blockers .chip").forEach((chip) => {
  chip.addEventListener("click", () => chip.classList.toggle("on"));
});

// Read everything typed on screens 2 and 3
function collectInputs() {
  return {
    name: document.getElementById("f-name").value,
    age: document.getElementById("f-age").value,
    qualification: document.getElementById("f-qual").value,
    job: document.getElementById("f-job").value,
    skills: skillList.slice(),
    work_learned: document.getElementById("f-learned").value,
    work_challenge: document.getElementById("f-challenge").value,
    blockers: [...document.querySelectorAll("#blockers .chip.on")].map((c) => c.textContent),
    custom_blocker: document.getElementById("f-custom").value,
  };
}

// "Find my next move" asks the backend to write the story

// Tapping a path card on screen 4 opens screen 5 with that path's scene
document.querySelectorAll(".path-card").forEach((card) => {
  card.addEventListener("click", () => {
    showScreen("screen-5");
    renderScene(card.dataset.path);
  });
});
// ---------- Screen 5: scene card ----------
const PATH_META = {
  A: { key: "path_a", label: "PATH A · SIX MONTHS LATER", from: -1 },
  B: { key: "path_b", label: "PATH B · SIX MONTHS LATER", from: 1 },
};

function renderScene(letter) {
  const meta = PATH_META[letter];
  const data = STORY.prompt2[meta.key];
  state.openPath = letter;

  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === letter)
  );
  document.getElementById("sc-label").textContent = meta.label;
  document.getElementById("sc-headline").textContent = data.headline;
  document.getElementById("sc-scene").textContent = data.scene;
  document.getElementById("sc-upside").textContent = data.upside;
  document.getElementById("sc-challenge").textContent = data.challenge;

  // Restart the entrance animation (the card arrives from the side of its tab)
  const stage = document.getElementById("stage");
  stage.dataset.path = letter;
  stage.style.setProperty("--from-x", meta.from * 38 + "%");
  stage.classList.remove("play");
  void stage.offsetWidth; // forces the browser to restart the animation
  stage.classList.add("play");

  burstSparkles(meta.from);
}

// Sparkles that trail along the card's path as it spins in
function burstSparkles(dir) {
  const stage = document.getElementById("stage");
  stage.querySelectorAll(".sparkle").forEach((s) => s.remove());

  const w = stage.clientWidth, h = stage.clientHeight;
  const sx = w / 2 + dir * w * 0.38, sy = h / 2 + 40; // where the card starts
  const ex = w / 2, ey = h / 2;                        // where it lands
  const colors = ["#ffffff", "#cbb8f5", "#7ee8d6"];
  const N = 34;

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.left = sx + (ex - sx) * t + (Math.random() - 0.5) * 60 + "px";
    s.style.top = sy + (ey - sy) * t + (Math.random() - 0.5) * 60 + "px";
    s.style.setProperty("--dx", (Math.random() - 0.5) * 50 + "px");
    s.style.setProperty("--dy", -(Math.random() * 50 + 10) + "px");
    s.style.animationDelay = t * 0.7 + "s";
    s.style.background = colors[i % 3];
    stage.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}

// Switching tabs on screen 5 replays the entrance
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => renderScene(tab.dataset.tab));
});

// ---------- Screen 6: Reflection & Insight ----------
const PATH_NAMES = { A: "Stay & Rewrite", B: "Step & Explore" };

function selectPath(letter) {
  state.chosenPath = letter;
  document.querySelectorAll(".choice").forEach((c) =>
    c.classList.toggle("selected", c.dataset.choice === letter)
  );
  document.getElementById("rf-choice-name").textContent = PATH_NAMES[letter];
}

function renderReflection() {
  const r = STORY.prompt3;
  document.getElementById("rf-a-line").textContent = r.path_a_line;
  document.getElementById("rf-b-line").textContent = r.path_b_line;
  document.getElementById("rf-question").textContent = r.reflection_question;
  selectPath(state.openPath || "A");
}

document.querySelectorAll(".choice").forEach((c) =>
  c.addEventListener("click", () => selectPath(c.dataset.choice))
);
document.querySelector('#screen-5 [data-goto="screen-6"]').addEventListener("click", renderReflection);

// ---------- Screen 7: The First Move ----------
let currentMove = null;

function paintMove(letter, m) {
  currentMove = m;
  document.getElementById("fm-greeting").textContent = m.greeting_line;
  document.getElementById("fm-letter").textContent = letter;
  document.getElementById("fm-path").textContent = PATH_NAMES[letter];
  document.getElementById("fm-label").textContent = "FIRST MOVE · " + String(m.move_label).toUpperCase();
  document.getElementById("fm-time").textContent = "⏱ " + m.minutes + " min";
  document.getElementById("fm-title").textContent = m.title;
  document.getElementById("fm-desc").textContent = m.description;
  document.getElementById("fm-opening").textContent = "“" + m.opening_line + "”";
  document.getElementById("fm-reassure").textContent = "✦ " + m.reassurance;
}

async function renderFirstMove() {
  const letter = state.chosenPath || "A";
  const fallbackMove = FALLBACK[letter === "A" ? "prompt4_path_a" : "prompt4_path_b"];

  // If the story came from the fallback, keep the whole journey consistent
  if (state.source !== "ai") {
    paintMove(letter, fallbackMove);
    return;
  }

  // Loading state while the AI writes the first move
  paintMove(letter, {
    greeting_line: "", move_label: "", minutes: "…", title: "Finding your first move…",
    description: "", opening_line: "", reassurance: "",
  });

  try {
    const scene = STORY.prompt2[letter === "A" ? "path_a" : "path_b"].scene;
    const m = await postJSON("/api/first-move", {
      name: (state.inputs && state.inputs.name) || "",
      chosen_path: letter,
      profile_summary: STORY.prompt1.profile_summary,
      chosen_scene: scene,
    });
    paintMove(letter, m);
  } catch (err) {
    console.warn("AI unavailable for the first move, using fallback:", err);
    paintMove(letter, fallbackMove);
  }
}

document.querySelector('#screen-6 [data-goto="screen-7"]').addEventListener("click", renderFirstMove);

// Copy the opening line to the clipboard
document.getElementById("copy-btn").addEventListener("click", async () => {
  const text = currentMove ? currentMove.opening_line : "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const t = document.createElement("textarea"); // fallback for older browsers
    t.value = text; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove();
  }
  const btn = document.getElementById("copy-btn");
  btn.innerHTML = "Copied ✓";
  setTimeout(() => (btn.innerHTML = "Copy my message <span>⧉</span>"), 2000);
});

// ---------- Connect to the backend ----------
// Local file or localhost -> your own backend. Anywhere else (Netlify) -> Render.
const API_BASE = (location.protocol === "file:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")
  ? "http://127.0.0.1:8000"
  : "https://x-one-api.onrender.com";
const FALLBACK = JSON.parse(JSON.stringify(STORY)); // Aarav's story, kept as the safety net

async function postJSON(path, body, ms = 70000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function setPathDescriptions(a, b) {
  document.getElementById("pathA-desc").textContent = a;
  document.getElementById("pathB-desc").textContent = b;
}

// Runs when the user presses "Find my next move" on screen 3
async function loadStory() {
  state.inputs = collectInputs();
  console.log("Saved inputs:", state.inputs);

  const cards = document.querySelectorAll(".path-card");
  cards.forEach((c) => (c.disabled = true));
  setPathDescriptions("Imagining your path…", "Imagining your path…");
  Object.assign(STORY, JSON.parse(JSON.stringify(FALLBACK))); // start from the safety net

  try {
    const data = await postJSON("/api/story", state.inputs);
    STORY.prompt1 = data.prompt1;
    STORY.prompt2 = data.prompt2;
    STORY.prompt3 = data.prompt3;
    state.source = "ai";
    console.log("Story written by AI");
  } catch (err) {
    console.warn("AI unavailable, using the fallback story:", err);
    state.source = "fallback";
  }

  setPathDescriptions(STORY.prompt1.path_a_description, STORY.prompt1.path_b_description);
  cards.forEach((c) => (c.disabled = false));
}
// ---------- Skills: add and remove ----------
let skillList = [];

function renderSkills() {
  const box = document.getElementById("skills");
  box.innerHTML = "";
  skillList.forEach((s, i) => {
    const chip = document.createElement("span");
    chip.className = "chip on";
    chip.textContent = s;
    const x = document.createElement("b");
    x.className = "x";
    x.textContent = "×";
    x.addEventListener("click", () => { skillList.splice(i, 1); renderSkills(); });
    chip.appendChild(x);
    box.appendChild(chip);
  });
}

function addSkill() {
  const input = document.getElementById("skill-input");
  const v = input.value.trim();
  if (v && skillList.length < 12 && !skillList.some((s) => s.toLowerCase() === v.toLowerCase())) {
    skillList.push(v.slice(0, 40));
    renderSkills();
  }
  input.value = "";
}

document.getElementById("skill-add").addEventListener("click", addSkill);
document.getElementById("skill-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addSkill(); }
});

// ---------- Moving on from screens 2 and 3 (with a check) ----------
document.getElementById("next-s2").addEventListener("click", () => {
  addSkill(); // keep a skill that was typed but not added yet
  const err = document.getElementById("err-s2");
  const name = document.getElementById("f-name").value.trim();
  const job = document.getElementById("f-job").value.trim();
  if (!name || !job) {
    err.textContent = "Please add your name and a line about your current job.";
    return;
  }
  err.textContent = "";
  showScreen("screen-3");
});

document.getElementById("next-s3").addEventListener("click", () => {
  const err = document.getElementById("err-s3");
  if (!document.getElementById("f-challenge").value.trim()) {
    err.textContent = "Tell us in a line or two what you'd like to change.";
    return;
  }
  err.textContent = "";
  showScreen("screen-4");
  loadStory();
});

// ---------- Example story button (fills Aarav's details) ----------
document.getElementById("fill-demo").addEventListener("click", () => {
  const set = (id, v) => (document.getElementById(id).value = v);
  set("f-name", "Aarav");
  set("f-age", "27");
  set("f-qual", "Bachelor's degree");
  set("f-job", "Data analyst at a US-based company, working from home. Four years on the same client.");
  skillList = ["Data Analytics", "Power BI", "Advanced DAX", "Storytelling", "Excel + VBA", "Python"];
  renderSkills();
  set("f-learned", "You're on your own. Everything needs written proof. You're expected to be flawless, even on your first try.");
  set("f-challenge", "My client bothers me most. My skills are rusting on a simple client, and my managers don't seem confident enough to change it.");
  set("f-custom", "My 90-day notice period means other companies may not wait, and I fear losing my gym and diet routine.");
  document.querySelectorAll("#blockers .chip").forEach((c) =>
    c.classList.toggle("on", ["Money", "No clear path", "Confidence"].includes(c.textContent))
  );
});
// ---------- Saving progress in the browser (localStorage) ----------
const STORE_KEY = "xone_v1";

function loadSave() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch (e) { return {}; }
}
function writeSave(patch) {
  try {
    const merged = Object.assign(loadSave(), patch, { updated: Date.now() });
    localStorage.setItem(STORE_KEY, JSON.stringify(merged));
  } catch (e) { console.warn("Could not save progress:", e); }
}
function clearSave() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
}

// Save automatically after the story is written (a new story starts a fresh journey)
const _loadStory = loadStory;
loadStory = async function () {
  await _loadStory();
  state.quest = null; state.progress = {};
  writeSave({
    inputs: state.inputs,
    story: { prompt1: STORY.prompt1, prompt2: STORY.prompt2, prompt3: STORY.prompt3 },
    source: state.source,
    chosenPath: null,
    move: null,
    chosenPath: null,
    move: null,
    quest: null,
    progress: {},
  });
};

// Save the first move once it has really been written
const _paintMove = paintMove;
paintMove = function (letter, m) {
  _paintMove(letter, m);
  if (m && m.opening_line) writeSave({ move: m });
};

// Save the path when the user presses "Choose this journey"
document.querySelector('#screen-6 [data-goto="screen-7"]').addEventListener("click", () => {
  writeSave({ chosenPath: state.chosenPath || "A" });
});

// ---------- Bring a saved journey back ----------
function restoreFromSave() {
  const s = loadSave();
  if (!s.story) return;

  state.inputs = s.inputs || {};
  state.source = s.source || "fallback";
  state.chosenPath = s.chosenPath || null;
  Object.assign(STORY, s.story);

  // Refill the form fields
  const i = state.inputs;
  const set = (id, v) => { document.getElementById(id).value = v || ""; };
  set("f-name", i.name); set("f-age", i.age); set("f-job", i.job);
  set("f-learned", i.work_learned); set("f-challenge", i.work_challenge); set("f-custom", i.custom_blocker);
  if (i.qualification) set("f-qual", i.qualification);
  skillList = (i.skills || []).slice();
  renderSkills();
  document.querySelectorAll("#blockers .chip").forEach((c) =>
    c.classList.toggle("on", (i.blockers || []).includes(c.textContent))
  );

  setPathDescriptions(STORY.prompt1.path_a_description, STORY.prompt1.path_b_description);
    if (s.quest) {
    state.quest = s.quest;
    state.progress = s.progress || {};
    renderQuestPreview();
    showScreen("screen-9");
    return;
  }
  if (s.chosenPath && s.move) {
    paintMove(s.chosenPath, s.move);
    showScreen("screen-7");
  } else {
    showScreen("screen-4");
  }
}
// ---------- Continue / Start over buttons (built by code, so they always land on Screen 1) ----------
function buildContinueButtons() {
  // remove any old copies, wherever they ended up
  document.querySelectorAll("#continue-btn, #reset-btn").forEach((el) => el.remove());

  const bottom = document.querySelector("#screen-1 .bottom");
  const startBtn = bottom.querySelector('[data-goto="screen-2"]');

  const cont = document.createElement("button");
  cont.id = "continue-btn";
  cont.className = "btn outline";
  cont.innerHTML = "Continue my journey <span>→</span>";
  cont.addEventListener("click", restoreFromSave);

  const reset = document.createElement("button");
  reset.id = "reset-btn";
  reset.type = "button";
  reset.className = "link-btn";
  reset.textContent = "Start over";
  reset.addEventListener("click", () => { clearSave(); location.reload(); });

  startBtn.after(cont, reset);

  const show = loadSave().story ? "block" : "none";
  cont.style.display = show;
  reset.style.display = show;
}
buildContinueButtons();
window.addEventListener("pageshow", buildContinueButtons);
// ---------- Screen 8: choose your quest ----------
let chosenGoal = "";

function selectGoal(title) {
  chosenGoal = title;
  document.querySelectorAll("#goal-list .choice").forEach((c) =>
    c.classList.toggle("selected", c.dataset.title === title)
  );
}

function drawGoals(goals, note) {
  const box = document.getElementById("goal-list");
  box.innerHTML = "";
  goals.forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.dataset.title = g.title;
    const s = document.createElement("strong");
    s.textContent = g.title;
    const p = document.createElement("span");
    p.textContent = g.why;
    const t = document.createElement("i");
    t.className = "tick";
    t.textContent = "✓";
    b.append(s, p, t);
    b.addEventListener("click", () => {
      document.getElementById("goal-own").value = "";
      selectGoal(g.title);
    });
    box.appendChild(b);
  });
  document.getElementById("goal-note").textContent = note || "";
}

async function openQuestPicker() {
   if (state.quest) { renderQuestPreview(); showScreen("screen-9"); return; }
  showScreen("screen-8");
  chosenGoal = "";
  document.getElementById("err-s8").textContent = "";
  const box = document.getElementById("goal-list");

  if (state.source !== "ai") {
    drawGoals(
      [{ title: QUEST_FALLBACK.goal, why: "An example quest for the demo story (Aarav)." }],
      "The AI is unavailable right now, so only the example quest can be used."
    );
    return;
  }

  box.innerHTML = '<p class="muted">Finding goals that fit your story…</p>';
  try {
    const data = await postJSON("/api/goals", {
      profile_summary: STORY.prompt1.profile_summary,
      chosen_path: state.chosenPath || "A",
      first_move_title: currentMove ? currentMove.title : "",
    });
    drawGoals(data.goals, "");
  } catch (e) {
    console.warn("Could not fetch goals:", e);
    box.innerHTML = '<p class="muted">Could not fetch suggestions. Type your own goal below.</p>';
  }
}

document.getElementById("to-quest").addEventListener("click", openQuestPicker);
document.getElementById("goal-own").addEventListener("input", () => {
  chosenGoal = "";
  document.querySelectorAll("#goal-list .choice").forEach((c) => c.classList.remove("selected"));
});

async function buildQuest() {
  const own = document.getElementById("goal-own").value.trim();
  const goal = own || chosenGoal;
  const err = document.getElementById("err-s8");
  if (goal.length < 3) { err.textContent = "Pick a goal or type your own."; return; }
  if (state.source !== "ai" && goal !== QUEST_FALLBACK.goal) {
    err.textContent = "The AI is unavailable, so only the example quest can be used right now.";
    return;
  }
  err.textContent = "";

  const btn = document.getElementById("build-quest");
  btn.disabled = true;
  btn.textContent = "Designing your missions…";
  try {
    let quest;
    if (state.source !== "ai") {
      quest = JSON.parse(JSON.stringify(QUEST_FALLBACK));
    } else {
      quest = await postJSON("/api/quest", {
        name: (state.inputs && state.inputs.name) || "",
        profile_summary: STORY.prompt1.profile_summary,
        skills: (state.inputs && state.inputs.skills) || [],
        chosen_path: state.chosenPath || "A",
        goal: goal,
      }, 90000);
    }
    state.quest = quest;
    writeSave({ quest: quest });
    renderQuestPreview();
    showScreen("screen-9");
  } catch (e) {
    console.warn("Quest failed:", e);
    err.textContent = String(e.message).includes("422")
      ? "That goal is not something we can build a quest for. Try a different one."
      : "We could not build your quest just now. Please try again.";
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Build my quest <span>→</span>";
  }
}
document.getElementById("build-quest").addEventListener("click", buildQuest);

// ---------- Quest progress and missions ----------
state.progress = state.progress || {};
let missionIndex = 0;
const byId = (id) => document.getElementById(id);

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}



function levelStatus(i) {
  const q = state.quest;
  const lv = q.levels[i];
  const p = state.progress[lv.id];
  if (p && p.status === "accepted") return "accepted";
  const unlocked = i === 0 || (state.progress[q.levels[i - 1].id] || {}).status === "accepted";
  if (!unlocked) return "locked";
  return p && p.status === "needs_changes" ? "needs_changes" : "active";
}

function totalXP() {
  if (!state.quest) return 0;
  return state.quest.levels.reduce((sum, lv) => {
    const p = state.progress[lv.id];
    return sum + (p && p.status === "accepted" ? lv.xp : 0);
  }, 0);
}


function checkLink(v) {
  if (!v) return "Paste a link to your work.";
  let u;
  try { u = new URL(v); } catch (e) { return "That does not look like a web link. It should start with https://"; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return "Please use a normal web link starting with https://";
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || ["example.com", "test.com", "localhost"].includes(h)) return "Please paste the real link to your work.";
  return "";
}

function openMission(i) {
  const q = state.quest;
  const lv = q.levels[i];
  const st = levelStatus(i);
  if (st === "locked") { toast("Finish Level " + i + " first. It unlocks this one."); return; }
  missionIndex = i;
  const p = state.progress[lv.id] || {};
  const ev = lv.evidence;
  const done = st === "accepted";

  byId("m-xp").textContent = totalXP() + " XP";
  byId("m-eyebrow").textContent = "LEVEL " + lv.number + " OF " + q.levels.length;
  byId("m-title").textContent = lv.title;
  byId("m-meta").textContent = lv.placeholder ? "Coming after this prototype" : lv.minutes + " min · " + lv.xp + " XP";
  byId("m-objective").textContent = lv.objective;

  const steps = byId("m-steps");
  steps.innerHTML = "";
  lv.instructions.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    steps.appendChild(li);
  });
  byId("m-steps-wrap").style.display = lv.instructions.length ? "block" : "none";

  const res = byId("m-resources");
  res.innerHTML = "";
  if (lv.resources.length) {
    const h = document.createElement("small");
    h.className = "lbl";
    h.textContent = "WHERE TO LEARN";
    res.appendChild(h);
    lv.resources.forEach((r) => {
      const a = document.createElement("a");
      a.className = "res";
      a.href = "https://www.google.com/search?q=" + encodeURIComponent(r.search);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "🔎 " + r.label;
      res.appendChild(a);
    });
  }

  // Evidence form
  const card = byId("m-evidence-card");
  const form = byId("m-form");
  form.innerHTML = "";
  byId("m-err").textContent = "";
  byId("m-confirm").checked = done;
  byId("m-confirm").disabled = done;
  const status = byId("m-status");
  status.className = "status-note";

  if (ev.kind === "none") {
    card.style.display = "none";
    byId("m-submit").style.display = "none";
    byId("m-next").style.display = "none";
    status.textContent = "Finish the missions above to unlock harder ones. This level comes after the prototype.";
    showScreen("screen-10");
    return;
  }
  card.style.display = "block";
  byId("m-prompt").textContent = ev.prompt;

  if (ev.kind === "link") {
    const inp = document.createElement("input");
    inp.id = "m-in"; inp.className = "input"; inp.type = "url";
    inp.placeholder = ev.link_hint || "https://...";
    inp.value = typeof p.evidence === "string" ? p.evidence : "";
    inp.disabled = done;
    form.appendChild(inp);
  } else if (ev.kind === "reflection") {
    const ta = document.createElement("textarea");
    ta.id = "m-in"; ta.className = "input"; ta.rows = 5;
    ta.placeholder = "Write it in your own words…";
    ta.value = typeof p.evidence === "string" ? p.evidence : "";
    ta.disabled = done;
    const count = document.createElement("small");
    count.className = "count";
    const upd = () => { count.textContent = ta.value.trim().length + " / at least " + (ev.min_chars || 100); };
    ta.addEventListener("input", upd);
    upd();
    form.append(ta, count);
  } else {
    ev.items.forEach((text) => {
      const row = document.createElement("label");
      row.className = "chk-row";
      const c = document.createElement("input");
      c.type = "checkbox"; c.className = "m-chk"; c.checked = done; c.disabled = done;
      const s = document.createElement("span");
      s.textContent = text;
      row.append(c, s);
      form.appendChild(row);
    });
  }

  if (done) {
    const when = p.acceptedAt ? new Date(p.acceptedAt).toLocaleDateString() : "";
    status.textContent = "✓ Accepted on " + when + " (self-confirmed). This prototype does not independently verify evidence.";
    status.classList.add("good");
  } else if (st === "needs_changes") {
    status.textContent = "Needs changes: " + (p.feedback || "please review and resubmit.");
    status.classList.add("warn");
  } else {
    status.textContent = "Not submitted yet.";
  }

  byId("m-submit").style.display = done ? "none" : "block";
  byId("m-next").style.display = done ? "block" : "none";
  showScreen("screen-10");
}

function submitEvidence() {
  const q = state.quest;
  const i = missionIndex;
  const lv = q.levels[i];
  const st = levelStatus(i);
  if (st === "accepted" || st === "locked") return; // no double rewards, no skipping ahead
  const ev = lv.evidence;
  const prior = Object.entries(state.progress)
    .filter(([id, p]) => id !== lv.id && p.status === "accepted")
    .map(([, p]) => p.evidence);

  const reject = (msg, draft) => {
    state.progress[lv.id] = { status: "needs_changes", feedback: msg, evidence: draft };
    writeSave({ progress: state.progress });
    openMission(i);
    byId("m-err").textContent = msg;
  };

  if (!byId("m-confirm").checked) {
    byId("m-err").textContent = "Please confirm you really did this yourself.";
    return;
  }

  let value;
  if (ev.kind === "link") {
    value = byId("m-in").value.trim();
    const bad = checkLink(value);
    if (bad) return reject(bad, value);
    const norm = (s) => String(s).toLowerCase().replace(/\/$/, "");
    if (prior.some((v) => typeof v === "string" && norm(v) === norm(value)))
      return reject("You already used this link for another mission. Each mission needs its own proof.", value);
  } else if (ev.kind === "reflection") {
    value = byId("m-in").value.trim();
    const need = ev.min_chars || 100;
    if (value.length < need)
      return reject("Write a little more: at least " + need + " characters (you have " + value.length + ").", value);
    if (prior.some((v) => typeof v === "string" && v.toLowerCase() === value.toLowerCase()))
      return reject("This looks the same as an earlier answer. Write about this mission.", value);
  } else {
    const boxes = [...document.querySelectorAll(".m-chk")];
    if (!boxes.every((b) => b.checked)) {
      byId("m-err").textContent = "Tick every step once you have really done it.";
      return;
    }
    value = ev.items.slice();
  }

  state.progress[lv.id] = { status: "accepted", kind: ev.kind, evidence: value, acceptedAt: Date.now() };
  writeSave({ progress: state.progress });
  openMission(i);
  celebrate(lv);
}

byId("m-submit").addEventListener("click", submitEvidence);
byId("m-back").addEventListener("click", () => { renderQuestPreview(); showScreen("screen-9"); });
byId("m-next").addEventListener("click", () => {
  const next = missionIndex + 1;
  if (next < state.quest.levels.length) openMission(next);
  else { renderQuestPreview(); showScreen("screen-9"); }
});
// ---------- Journey map ----------
const MAP_W = 360, MAP_STEP = 130, MAP_TOP = 70;
function nodePos(i) { return { x: i % 2 === 0 ? 100 : 260, y: MAP_TOP + i * MAP_STEP }; }

function renderQuestPreview() {
  const q = state.quest;
  const maxXp = q.levels.reduce((s, l) => s + l.xp, 0);
  const xp = totalXP();
  byId("q-title").textContent = q.title;
  byId("q-goal").textContent = "Goal: " + q.goal;
  byId("q-xp-top").textContent = xp + " XP";
  byId("xp-text").textContent = xp + " / " + maxXp + " XP";
  const fill = byId("xp-fill");
  requestAnimationFrame(() => { fill.style.width = (maxXp ? (xp / maxXp) * 100 : 0) + "%"; });

  // Badges
  const real = q.levels.filter((l) => !l.placeholder);
  const done = real.filter((l) => (state.progress[l.id] || {}).status === "accepted").length;
  const badges = [
    { label: "🌱 First step", on: done >= 1 },
    { label: "🔥 Halfway there", on: done > 0 && done >= Math.ceil(real.length / 2) },
    { label: "🏆 Quest complete", on: real.length > 0 && done === real.length },
  ];
  const bx = byId("badges");
  bx.innerHTML = "";
  badges.forEach((b) => {
    const s = document.createElement("span");
    s.className = "badge" + (b.on ? " on" : "");
    s.textContent = b.label;
    bx.appendChild(s);
  });

  // Map and path
  const n = q.levels.length;
  const H = MAP_TOP * 2 + (n - 1) * MAP_STEP;
  const map = byId("q-map");
  map.style.height = H + "px";
  map.innerHTML = "";
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + MAP_W + " " + H);
  svg.setAttribute("preserveAspectRatio", "none");
  for (let i = 0; i < n - 1; i++) {
    const a = nodePos(i), b = nodePos(i + 1), my = (a.y + b.y) / 2;
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M" + a.x + "," + a.y + " C" + a.x + "," + my + " " + b.x + "," + my + " " + b.x + "," + b.y);
    p.setAttribute("class", "seg" + (levelStatus(i) === "accepted" ? " done" : ""));
    svg.appendChild(p);
  }
  map.appendChild(svg);

  // Nodes
  const hereIdx = q.levels.findIndex((lv, i) => ["active", "needs_changes"].includes(levelStatus(i)) && !lv.placeholder);
  q.levels.forEach((lv, i) => {
    const st = levelStatus(i);
    const pos = nodePos(i);
    const d = document.createElement("div");
    d.className = "node " + st + (state.justUnlocked === lv.id ? " pop" : "");
    d.style.left = (pos.x / MAP_W) * 100 + "%";
    d.style.top = pos.y + "px";

    if (i === hereIdx) {
      const h = document.createElement("div");
      h.className = "here";
      h.textContent = "✦ YOU ARE HERE";
      d.appendChild(h);
    }
    const orb = document.createElement("div");
    orb.className = "orb";
    orb.textContent = lv.placeholder && st !== "locked" ? "⚑" :
      { accepted: "✓", active: "▶", needs_changes: "↻", locked: "🔒" }[st];
    const lab = document.createElement("div");
    lab.className = "lab";
    lab.textContent = lv.title;
    const sm = document.createElement("small");
    if (st === "accepted") sm.textContent = "Accepted · +" + lv.xp + " XP";
    else if (st === "locked") sm.textContent = "Locked";
    else if (lv.placeholder) sm.textContent = "Coming soon";
    else sm.textContent = lv.minutes + " min · " + lv.xp + " XP";
    d.append(orb, lab, sm);
    d.addEventListener("click", () => openMission(i));
    map.appendChild(d);
  });
  state.justUnlocked = null;

  // What's next
  const nextIdx = q.levels.findIndex((lv, i) => levelStatus(i) !== "accepted");
  const nxt = byId("q-next");
  nxt.className = "status-note";
  if (done === real.length && real.length > 0) {
    nxt.textContent = "🏆 Every mission in this quest is complete. Harder missions unlock after this prototype.";
    nxt.classList.add("good");
  } else if (nextIdx >= 0) {
    nxt.textContent = "Next: Level " + q.levels[nextIdx].number + " · " + q.levels[nextIdx].title;
  }
}

// ---------- Celebration ----------
function celebrate(lv) {
  const i = state.quest.levels.findIndex((l) => l.id === lv.id);
  const next = state.quest.levels[i + 1];
  state.justUnlocked = next ? next.id : null;

  const box = byId("celebrate");
  box.querySelectorAll(".spark").forEach((s) => s.remove());
  byId("cel-sub").textContent = "Level " + lv.number + ": " + lv.title;
  byId("cel-xp").textContent = "+0 XP";
  byId("cel-unlock").textContent = next
    ? (next.placeholder ? "🏆 You finished every mission in this quest!" : "🔓 Level " + next.number + " unlocked: " + next.title)
    : "";

  box.classList.remove("show");
  void box.offsetWidth; // restart the animations
  box.classList.add("show");

  // XP counts up
  setTimeout(() => {
    const el = byId("cel-xp"), t0 = performance.now(), dur = 1100;
    (function tick(t) {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = "+" + Math.round(lv.xp * k) + " XP";
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }, 700);

  // Sparkle burst
  const colors = ["#ffffff", "#cbb8f5", "#7ee8d6"];
  for (let k = 0; k < 64; k++) {
    const s = document.createElement("span");
    s.className = "spark";
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 190;
    s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    s.style.background = colors[k % 3];
    s.style.animationDelay = Math.random() * 0.5 + "s";
    box.appendChild(s);
  }
}

byId("cel-btn").addEventListener("click", () => {
  byId("celebrate").classList.remove("show");
  renderQuestPreview();
  showScreen("screen-9");
  setTimeout(() => {
    const t = document.querySelector(".node.pop") || document.querySelector(".node.active");
    if (t) t.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 150);
});