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

// Tapping a path card remembers which path opens first on screen 5
document.querySelectorAll(".path-card").forEach((card) => {
  card.addEventListener("click", () => {
    state.openPath = card.dataset.path;
    showScreen("screen-5");
  });
});