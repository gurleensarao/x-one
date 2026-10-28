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
const API_BASE = "https://x-one-api.onrender.com"; // we change this to the live backend address when we deploy
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
  writeSave({
    inputs: state.inputs,
    story: { prompt1: STORY.prompt1, prompt2: STORY.prompt2, prompt3: STORY.prompt3 },
    source: state.source,
    chosenPath: null,
    move: null,
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