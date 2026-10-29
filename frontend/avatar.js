/* X-one avatar creator.
   A separate file on purpose: if anything in here fails, the rest of the app keeps working. */
(function () {
  "use strict";

  const OPTIONS = {
    skin: ["#f6d7c3", "#eec1a0", "#d9a074", "#b9764f", "#8d5524", "#5e3a1e"],
    face: ["smile", "grin", "calm"],
    hair: ["short", "long", "bun", "curly", "ponytail", "none"],
    hairColor: ["#2b1b17", "#5a3825", "#a8672b", "#d9b36c", "#8c3b5f", "#6e56cf"],
    outfit: ["hoodie", "blazer", "tee", "kurta"],
    outfitColor: ["#7b5cd6", "#2fa898", "#26306b", "#c4577f", "#c99a2e", "#3a3a4a"],
    acc: ["none", "glasses", "headphones", "earrings"],
  };
  const DEFAULT = { skin: 1, face: 0, hair: 0, hairColor: 1, outfit: 0, outfitColor: 0, acc: 0 };
  const GROUPS = [
    { key: "skin", title: "Skin tone", swatch: true, names: ["Light", "Fair", "Tan", "Brown", "Deep", "Rich"] },
    { key: "face", title: "Expression", names: ["Smile", "Big grin", "Calm"] },
    { key: "hair", title: "Hairstyle", names: ["Short", "Long", "Bun", "Curly", "Ponytail", "None"] },
    { key: "hairColor", title: "Hair colour", swatch: true, names: ["Black", "Brown", "Auburn", "Blonde", "Plum", "Violet"] },
    { key: "outfit", title: "Outfit", names: ["Hoodie", "Blazer", "Tee", "Kurta"] },
    { key: "outfitColor", title: "Outfit colour", swatch: true, names: ["Purple", "Teal", "Midnight", "Rose", "Gold", "Charcoal"] },
    { key: "acc", title: "Extra", names: ["None", "Glasses", "Headphones", "Earrings"] },
  ];
  const STAGES = ["Traveller", "Spark kindled", "Wayfinder", "Caped trailblazer", "Legend of the quest"];

  // Keep only valid choices (also protects against odd data in localStorage)
  function clean(av) {
    const out = {};
    Object.keys(DEFAULT).forEach((k) => {
      const n = Number(av && av[k]);
      out[k] = Number.isInteger(n) && n >= 0 && n < OPTIONS[k].length ? n : DEFAULT[k];
    });
    return out;
  }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return "rgb(" + c((n >> 16) & 255) + "," + c((n >> 8) & 255) + "," + c(n & 255) + ")";
  }

  function star(x, y, cls) {
    return '<path class="' + cls + '" d="M' + x + " " + (y - 8) + " L" + (x + 2.5) + " " + (y - 2.5) + " L" + (x + 8) + " " + y +
      " L" + (x + 2.5) + " " + (y + 2.5) + " L" + x + " " + (y + 8) + " L" + (x - 2.5) + " " + (y + 2.5) + " L" + (x - 8) + " " + y +
      " L" + (x - 2.5) + " " + (y - 2.5) + ' Z" fill="#f3e3a0"/>';
  }

  let uidCount = 0;

  // Draws the avatar. stage 0-4 = how far the journey has come (aura, sparkles, cape, crown)
  function avatarSVG(av, stage) {
    const a = clean(av);
    stage = stage || 0;
    const u = "xa" + ++uidCount;
    const skin = OPTIONS.skin[a.skin], skinD = shade(skin, 0.8);
    const hair = OPTIONS.hairColor[a.hairColor];
    const out = OPTIONS.outfitColor[a.outfitColor], outD = shade(out, 0.72);
    const hs = OPTIONS.hair[a.hair], of = OPTIONS.outfit[a.outfit], fc = OPTIONS.face[a.face], ac = OPTIONS.acc[a.acc];

    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 0 228 250" role="img" aria-label="Your avatar">';
    s += '<defs><radialGradient id="' + u + 'a"><stop offset="0" stop-color="#9d84e0" stop-opacity=".6"/><stop offset="1" stop-color="#9d84e0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4fd0"/><stop offset="1" stop-color="#2d1b6b"/></linearGradient></defs>';

    if (stage >= 1) s += '<circle class="av-aura" cx="100" cy="130" r="112" fill="url(#' + u + 'a)"/>';
    if (stage >= 3) s += '<path d="M34 244 C12 196 46 166 80 174 L120 174 C154 166 188 196 166 244 Z" fill="url(#' + u + 'c)" stroke="#b9a4f5" stroke-opacity=".6" stroke-width="2"/>';

    // hair behind the head
    if (hs === "long") s += '<path d="M48 104 C40 34 160 34 152 104 L158 190 C140 202 60 202 42 190 Z" fill="' + hair + '"/>';
    if (hs === "bun") s += '<circle cx="100" cy="26" r="20" fill="' + hair + '"/>';
    if (hs === "ponytail") s += '<ellipse cx="158" cy="130" rx="13" ry="36" transform="rotate(-14 158 130)" fill="' + hair + '"/>';
    if (hs === "curly") {
      [[60, 72, 20], [84, 48, 22], [112, 44, 22], [138, 56, 20], [150, 86, 16], [52, 100, 14], [148, 106, 13]].forEach((c) => {
        s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hair + '"/>';
      });
    }

    // body
    s += '<path d="M26 244 C26 196 62 174 100 174 C138 174 174 196 174 244 Z" fill="' + out + '"/>';
    s += '<rect x="86" y="138" width="28" height="42" rx="10" fill="' + skinD + '"/>';
    if (of === "hoodie") {
      s += '<path d="M72 178 C80 200 120 200 128 178" fill="none" stroke="' + outD + '" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M92 196 L90 222 M108 196 L110 222" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>';
    } else if (of === "blazer") {
      s += '<path d="M82 176 L100 214 L118 176 Z" fill="#f4f0ff"/><path d="M82 176 L100 214 L72 224 Z M118 176 L100 214 L128 224 Z" fill="' + outD + '"/>';
    } else if (of === "tee") {
      s += '<path d="M80 176 Q100 200 120 176 Z" fill="' + skinD + '"/><circle cx="100" cy="224" r="6" fill="#fff" fill-opacity=".8"/>';
    } else {
      s += '<path d="M86 176 L100 192 L114 176" fill="none" stroke="#f4f0ff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M100 192 L100 244" stroke="' + outD + '" stroke-width="2"/>' +
        '<circle cx="100" cy="206" r="2.6" fill="#f4f0ff"/><circle cx="100" cy="222" r="2.6" fill="#f4f0ff"/><circle cx="100" cy="238" r="2.6" fill="#f4f0ff"/>';
    }

    // head and face
    s += '<circle cx="54" cy="106" r="9" fill="' + skin + '"/><circle cx="146" cy="106" r="9" fill="' + skin + '"/>';
    s += '<ellipse cx="100" cy="100" rx="46" ry="54" fill="' + skin + '"/>';
    s += '<circle cx="72" cy="118" r="8" fill="#ff8aa8" opacity=".25"/><circle cx="128" cy="118" r="8" fill="#ff8aa8" opacity=".25"/>';
    s += '<ellipse cx="82" cy="100" rx="5" ry="6" fill="#1d1630"/><ellipse cx="118" cy="100" rx="5" ry="6" fill="#1d1630"/>';
    s += '<circle cx="84" cy="98" r="1.8" fill="#fff"/><circle cx="120" cy="98" r="1.8" fill="#fff"/>';
    s += '<path d="M72 88 Q82 82 92 87 M108 87 Q118 82 128 88" fill="none" stroke="#2a1f1c" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M100 106 Q96 118 101 120" fill="none" stroke="' + skinD + '" stroke-width="3" stroke-linecap="round"/>';
    if (fc === "grin") s += '<path d="M82 126 Q100 148 118 126 Z" fill="#fff" stroke="#3a1f2b" stroke-width="2.5" stroke-linejoin="round"/>';
    else if (fc === "calm") s += '<path d="M88 131 Q100 137 112 131" fill="none" stroke="#3a1f2b" stroke-width="3" stroke-linecap="round"/>';
    else s += '<path d="M84 128 Q100 142 116 128" fill="none" stroke="#3a1f2b" stroke-width="3" stroke-linecap="round"/>';

    // hair in front
    if (["short", "long", "bun", "ponytail"].indexOf(hs) >= 0) {
      s += '<path d="M53 100 C46 46 82 30 100 30 C120 30 156 46 147 100 C140 78 124 66 100 66 C76 66 60 78 53 100 Z" fill="' + hair + '"/>';
    }
    if (hs === "ponytail") s += '<circle cx="146" cy="98" r="5" fill="#f3c969"/>';
    if (hs === "curly") {
      [[78, 66, 15], [100, 60, 16], [122, 66, 15]].forEach((c) => {
        s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hair + '"/>';
      });
    }

    // extras
    if (ac === "glasses") {
      s += '<g fill="rgba(255,255,255,.14)" stroke="#2a2146" stroke-width="3"><circle cx="82" cy="101" r="14"/><circle cx="118" cy="101" r="14"/></g>' +
        '<path d="M96 101 L104 101 M68 100 L56 98 M132 100 L144 98" stroke="#2a2146" stroke-width="3" fill="none" stroke-linecap="round"/>';
    } else if (ac === "headphones") {
      s += '<path d="M50 104 C48 26 152 26 150 104" fill="none" stroke="#2a2146" stroke-width="7" stroke-linecap="round"/>' +
        '<rect x="42" y="92" width="16" height="30" rx="8" fill="#6e56cf"/><rect x="142" y="92" width="16" height="30" rx="8" fill="#6e56cf"/>';
    } else if (ac === "earrings") {
      s += '<circle cx="54" cy="120" r="4.5" fill="#f3c969"/><circle cx="146" cy="120" r="4.5" fill="#f3c969"/>';
    }

    if (stage >= 4) {
      s += '<path d="M68 48 L74 22 L90 40 L100 16 L110 40 L126 22 L132 48 Z" fill="#f3c969" stroke="#b58a1f" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="100" cy="30" r="3.5" fill="#ff6b9a"/>';
    }
    if (stage >= 2) s += star(22, 62, "av-star") + star(182, 84, "av-star s2") + star(170, 30, "av-star s3") + star(30, 160, "av-star s4");
    return s + "</svg>";
  }

  // How far the player has come: 0 to 4 (uses the real accepted missions)
  function evoStage() {
    try {
      const q = state.quest;
      if (!q) return 0;
      const real = q.levels.filter((l) => !l.placeholder);
      const done = real.filter((l) => (state.progress[l.id] || {}).status === "accepted").length;
      if (real.length && done === real.length) return 4;
      if (done >= 3 && done >= Math.ceil(real.length * 0.6)) return 3;
      if (done >= 2) return 2;
      if (done >= 1) return 1;
    } catch (e) {}
    return 0;
  }

  // ---------- Everything below needs the page ----------
  let draft = null, returnTo = "quest";

  function injectStyles() {
    const st = document.createElement("style");
    st.textContent =
      ".av-stage{display:flex;justify-content:center;padding:4px 0}.av-stage svg{width:190px;height:auto;overflow:visible}" +
      ".av-group{margin:12px 0;text-align:left}.av-group h4{font-family:var(--font-title);font-style:italic;font-weight:500;font-size:17px;margin:0 0 8px}" +
      ".av-row{display:flex;flex-wrap:wrap;gap:8px}" +
      ".av-opt{padding:8px 14px;border-radius:99px;font-family:var(--font-body);font-size:13px;color:var(--text);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);cursor:pointer}" +
      ".av-opt.sw{width:34px;height:34px;padding:0;border-radius:50%}.av-opt.on{border-color:var(--lavender);box-shadow:0 0 0 3px rgba(157,132,224,.4)}" +
      ".map-avatar{display:flex;align-items:center;justify-content:center;gap:14px;cursor:pointer}.map-avatar svg{width:92px;height:auto;overflow:visible}" +
      ".map-avatar .cap{text-align:left;font-size:12px;color:var(--muted)}.map-avatar .cap strong{display:block;font-family:var(--font-title);font-size:21px;font-weight:500;color:var(--text)}" +
      ".cel-avatar svg{width:120px;height:auto;overflow:visible;animation:celrise .8s .1s both}.cel-avatar{margin-bottom:2px}" +
      ".av-star{animation:avtw 2s ease-in-out infinite alternate}.av-star.s2{animation-delay:.5s}.av-star.s3{animation-delay:1s}.av-star.s4{animation-delay:1.5s}" +
      ".av-aura{animation:avpulse 3s ease-in-out infinite alternate}@keyframes avtw{from{opacity:.3}to{opacity:1}}@keyframes avpulse{from{opacity:.6}to{opacity:1}}" +
      "@media (prefers-reduced-motion:reduce){.av-star,.av-aura{animation:none}}";
    document.head.appendChild(st);
  }

  function buildScreen() {
    const sec = document.createElement("section");
    sec.id = "screen-11";
    sec.className = "screen form-screen mist";
    sec.innerHTML =
      '<header class="topbar"><button class="back" id="av-back" aria-label="Back">←</button>' +
      '<div class="brand">X-one<small>Expand Possibilities</small></div><span class="step">AVATAR</span></header>' +
      '<div class="center"><p class="eyebrow">✦ YOUR HERO</p><h2 class="title wide">Create your avatar</h2>' +
      '<p class="muted">This is you on the journey map.<br>It grows as you finish real missions.</p></div>' +
      '<div class="av-stage" id="av-preview"></div><div id="av-groups"></div>' +
      '<button type="button" class="link-btn" id="av-random">🎲 Surprise me</button>' +
      '<div class="bottom"><button class="btn" id="av-save">Save and begin <span>→</span></button>' +
      '<p class="footnote">Drawn in code for this prototype. You can change it later from the journey map.</p></div>';
    document.querySelector("main.app").appendChild(sec);

    const box = sec.querySelector("#av-groups");
    GROUPS.forEach((g) => {
      const wrap = document.createElement("div");
      wrap.className = "av-group";
      const h = document.createElement("h4");
      h.textContent = g.title;
      const row = document.createElement("div");
      row.className = "av-row";
      OPTIONS[g.key].forEach((val, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "av-opt" + (g.swatch ? " sw" : "");
        b.dataset.k = g.key;
        b.dataset.i = i;
        b.setAttribute("aria-label", g.title + ": " + g.names[i]);
        if (g.swatch) b.style.background = val;
        else b.textContent = g.names[i];
        b.addEventListener("click", () => { draft[g.key] = i; drawCreator(); });
        row.appendChild(b);
      });
      wrap.append(h, row);
      box.appendChild(wrap);
    });

    sec.querySelector("#av-back").addEventListener("click", () => showScreen(returnTo === "map" ? "screen-9" : "screen-7"));
    sec.querySelector("#av-random").addEventListener("click", () => {
      Object.keys(OPTIONS).forEach((k) => { draft[k] = Math.floor(Math.random() * OPTIONS[k].length); });
      drawCreator();
    });
    sec.querySelector("#av-save").addEventListener("click", () => {
      state.avatar = clean(draft);
      writeSave({ avatar: state.avatar });
      if (returnTo === "map") { renderQuestPreview(); showScreen("screen-9"); }
      else openQuestPicker();
    });
  }

  function drawCreator() {
    document.getElementById("av-preview").innerHTML = avatarSVG(draft, evoStage());
    document.querySelectorAll("#av-groups .av-opt").forEach((b) => {
      const on = draft[b.dataset.k] === Number(b.dataset.i);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function openCreator(rt) {
    returnTo = rt;
    draft = clean(state.avatar || DEFAULT);
    drawCreator();
    showScreen("screen-11");
  }

  function paintMapAvatar() {
    const screen = document.getElementById("screen-9");
    if (!screen) return;
    let box = document.getElementById("map-avatar");
    if (!box) {
      box = document.createElement("div");
      box.id = "map-avatar";
      box.className = "map-avatar";
      box.setAttribute("role", "button");
      box.tabIndex = 0;
      const bar = screen.querySelector(".xpbar");
      bar.parentNode.insertBefore(box, bar);
      box.addEventListener("click", () => openCreator("map"));
      box.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCreator("map"); }
      });
    }
    const stage = evoStage();
    box.innerHTML = avatarSVG(state.avatar || DEFAULT, stage);
    const cap = document.createElement("div");
    cap.className = "cap";
    const nm = document.createElement("strong");
    nm.textContent = (state.inputs && state.inputs.name) || "Hero";
    const t = document.createElement("span");
    t.textContent = STAGES[stage] + (state.avatar ? " · tap to edit" : " · tap to create your avatar");
    cap.append(nm, t);
    box.appendChild(cap);
  }

  function init() {
    try {
      injectStyles();
      const saved = loadSave();
      if (saved && saved.avatar) state.avatar = clean(saved.avatar);
      buildScreen();

      // The map shows the avatar every time it is drawn
      const baseRender = renderQuestPreview;
      renderQuestPreview = function () { baseRender(); paintMapAvatar(); };

      // The celebration shows the avatar with its new look
      const cel = document.getElementById("celebrate");
      if (cel) {
        const holder = document.createElement("div");
        holder.id = "cel-avatar";
        holder.className = "cel-avatar";
        cel.insertBefore(holder, cel.querySelector(".cel-woo"));
        const baseCelebrate = celebrate;
        celebrate = function (lv) {
          baseCelebrate(lv);
          holder.innerHTML = avatarSVG(state.avatar || DEFAULT, evoStage());
        };
      }

      // "Start my quest": make the avatar first, only the first time
      const tq = document.getElementById("to-quest");
      if (tq) {
        const nb = tq.cloneNode(true);
        tq.parentNode.replaceChild(nb, tq);
        nb.addEventListener("click", () => {
          if (state.avatar) openQuestPicker();
          else openCreator("quest");
        });
      }
    } catch (e) {
      console.warn("Avatar module failed, the rest of the app still works:", e);
    }
  }

  if (typeof window !== "undefined") window.XoneAvatar = { svg: avatarSVG, clean: clean, OPTIONS: OPTIONS, STAGES: STAGES };
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
