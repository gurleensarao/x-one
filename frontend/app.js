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
    skills: [...document.querySelectorAll("#skills .chip")].map((c) => c.textContent),
    work_learned: document.getElementById("f-learned").value,
    work_challenge: document.getElementById("f-challenge").value,
    blockers: [...document.querySelectorAll("#blockers .chip.on")].map((c) => c.textContent),
    custom_blocker: document.getElementById("f-custom").value,
  };
}

// "Find my next move" saves the inputs
document.querySelector('#screen-3 [data-goto="screen-4"]').addEventListener("click", () => {
  state.inputs = collectInputs();
  console.log("Saved inputs:", state.inputs);
});
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