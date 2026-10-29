/* X-one safety and honesty polish. Separate file on purpose: the app still works without it. */
(function () {
  "use strict";

  // Words that suggest the person may be in distress
  const RISK = /(kill\s+(my\s*self|myself)|suicid|end\s+my\s+life|end\s+it\s+all|take\s+my\s+own\s+life|want\s+to\s+die|wanna\s+die|better\s+off\s+dead|self[\s-]?harm|hurt\s+myself|cut\s+myself|no\s+reason\s+to\s+live|don'?t\s+want\s+to\s+(live|be\s+here)|marna\s+chah|jeena\s+nahi|khudkushi|aatmahatya)/i;

  function injectStyles() {
    const st = document.createElement("style");
    st.textContent =
      ".src-note{font-size:12px;text-align:center;margin:-6px 0 4px}.src-note.ai{color:#7ee8d6}.src-note.fb{color:#ffb86b}" +
      ".care{position:fixed;top:0;bottom:0;left:50%;width:100%;max-width:430px;transform:translateX(-50%);z-index:100000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(5,5,12,.92)}" +
      ".care.show{display:flex}.care .box{background:rgba(24,20,48,.98);border:1px solid var(--lavender);border-radius:20px;padding:24px;text-align:left;box-shadow:0 0 30px rgba(157,132,224,.4)}" +
      ".care h3{font-family:var(--font-title);font-weight:500;font-size:28px;margin-bottom:10px}.care p{font-size:14px;line-height:1.55;color:#d6d0ec;margin-bottom:10px}.care .btn{margin-top:8px}";
    document.head.appendChild(st);
  }

  function buildCare() {
    const d = document.createElement("div");
    d.id = "care";
    d.className = "care";
    d.setAttribute("role", "dialog");
    d.innerHTML =
      '<div class="box"><h3>Let’s pause for a moment</h3>' +
      "<p>It sounds like you may be carrying something heavy. X-one is a career reflection tool, and it can’t give you the care you deserve right now.</p>" +
      "<p>Please consider talking to someone you trust, or to a trained listener. In India you can call <b>Tele-MANAS at 14416</b> (or 1-800-891-4416). If you are in immediate danger, call your local emergency number (<b>112</b> in India).</p>" +
      '<button class="btn" id="care-close">Close</button></div>';
    document.querySelector("main.app").appendChild(d);
    d.querySelector("#care-close").addEventListener("click", () => d.classList.remove("show"));
  }

  function showCare() { document.getElementById("care").classList.add("show"); }

  // Honest label: was this story written by the AI, or is it the example?
  function paintSourceNotes() {
    ["screen-4", "screen-5"].forEach((id) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      let n = sec.querySelector(".src-note");
      if (!n) {
        n = document.createElement("p");
        sec.querySelector(".topbar").after(n);
      }
      const ai = state.source === "ai";
      n.className = "src-note " + (ai ? "ai" : "fb");
      n.textContent = !state.source ? "" :
        ai ? "✦ Written for you by AI, from what you shared." :
          "⚠ The AI could not be reached, so this is an example story (Aarav).";
    });
  }

  function fixCounters() {
    const steps = { "screen-2": "1 / 6", "screen-3": "2 / 6", "screen-4": "3 / 6", "screen-5": "4 / 6", "screen-6": "5 / 6", "screen-7": "6 / 6" };
    Object.keys(steps).forEach((id) => {
      const el = document.querySelector("#" + id + " .step");
      if (el) el.textContent = steps[id];
    });
  }

  function init() {
    try {
      injectStyles();
      buildCare();
      fixCounters();

      // Check what the person wrote before it is sent to the AI
      const baseLoad = loadStory;
      loadStory = async function () {
        const text = ["f-job", "f-learned", "f-challenge", "f-custom"]
          .map((id) => (document.getElementById(id) || {}).value || "").join(" ");
        if (RISK.test(text)) { showScreen("screen-3"); showCare(); return; }
        await baseLoad();
        paintSourceNotes();
      };

      // Same check for a goal the person types themselves
      const basePost = postJSON;
      postJSON = function (path, body, ms) {
        if (path === "/api/quest" && body && RISK.test(String(body.goal || ""))) {
          showCare();
          return Promise.reject(new Error("HTTP 422"));
        }
        return basePost(path, body, ms);
      };

      const baseShow = showScreen;
      showScreen = function (id) {
        baseShow(id);
        if (id === "screen-4" || id === "screen-5") paintSourceNotes();
      };
    } catch (e) {
      console.warn("Safety module failed, the rest of the app still works:", e);
    }
  }

  if (typeof window !== "undefined") window.XoneSafety = { risk: RISK };
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
