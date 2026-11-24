/* =====================================================================
   GAME
   Screens, the rounds of tasks (one round per profile), the (rigged) review
   at the end of each round, resets, disappearing, the strike and the endings.
   Texts, settings and the demo tasks: content.js · Tasks: tasks.js · Messages (popups): story.js
   ===================================================================== */

const qs = new URLSearchParams(location.search);
if(qs.get("seconds")) CONFIG.TASK_SECONDS = Math.max(3, +qs.get("seconds"));
const FAST = qs.has("fast");
const wait = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 120) : ms));
const $ = s => document.querySelector(s);
const fmt = (s, v={}) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const clock = s => { const c = Math.max(0, Math.ceil(s)); return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, "0")}`; };

const G = { worker:null, used:[], name:"", id:"", resets:0, pos:0, round:[], roundNo:1,
            task:null, timer:null, cleanup:null, tasksDone:0, history:[], busy:false, ended:false };

const presence = () => CONFIG.PRESENCE[Math.min(G.resets, CONFIG.PRESENCE.length - 1)];
const resetsLeft = () => Math.max(0, CONFIG.PRESENCE.length - 1 - G.resets);
const pct = p => Math.round(p * 100);
const visible = p => 1 - (1 - p) * CONFIG.SCREEN_FADE;   // how visible the screen is at a given presence
// the fading: a black layer over the whole screen (0 = none, 1 = everything black)
const setFade = amount => document.documentElement.style.setProperty("--veil", amount.toFixed(2));
// previous fading (towards white): const setFade = amount => document.documentElement.style.setProperty("--lift", Math.round(255 * amount));
const roundLength = () => G.worker ? DEMO[G.worker.id].length : 4;

/* ---------------- header + side panel ---------------- */
function setTime(text, fraction){
  $("#hdr-time").textContent = text;
  $("#timer > div").style.width = (Math.max(0, fraction) * 100) + "%";
}
function updatePanels(){
  // one fade for everything: the whole screen fades towards black at the same pace
  setFade(1 - visible(presence()));
  if(!G.worker) return;
  const taskOf = fmt(TEXT.panels.chainOf, { n:Math.min(G.pos + 1, roundLength()), total:roundLength() });
  $("#worker-title").textContent = `Worker ${G.worker.number} · ${G.worker.title}`;
  $("#lbl-chain").textContent = fmt(TEXT.panels.chain, { n:G.roundNo });
  $("#chain-text").textContent = taskOf;
  $("#chain-bar").style.width = (G.pos / roundLength() * 100) + "%";
  $("#resets").textContent = Array.from({ length:resetsLeft() }, () => "(*)").join(" ");
  $("#hdr").textContent = `${G.id} · ${taskOf}`;
}

/* =====================================================================
   SCREENS BEFORE WORK
   ===================================================================== */

/* 1. human verification: "Select those who cannot dream." */
function showVerification(){
  const s = TEXT.select;
  $("#main").innerHTML = `<section class="screen">
    <p class="big">${s.human}</p>
    <div class="captcha">
      <div class="captcha-head"><div class="prompt">${esc(VERIFY.prompt)}</div></div>
      <div class="photos" id="dream">${VERIFY.images.map((im, i) =>
        `<button type="button" class="photo" data-i="${i}"><img src="${esc(im.src)}" alt="" draggable="false"></button>`).join("")}</div>
      <p><button id="verify">${esc(s.captcha.verify)}</button> <span class="muted" id="retry"></span></p>
    </div></section>`;
  const chosen = new Set();
  document.querySelectorAll("#dream .photo").forEach(b => b.onclick = () => {
    const i = +b.dataset.i; chosen.has(i) ? chosen.delete(i) : chosen.add(i);
    b.classList.toggle("chosen", chosen.has(i)); $("#retry").textContent = ""; Sound.play("click");
  });
  $("#verify").onclick = () => {
    // right: every thing that cannot dream is selected, nobody who dreams is; the open ones count either way
    const ok = VERIFY.images.every((im, i) => im.cannot === null || im.cannot === chosen.has(i));
    if(!ok){ $("#retry").textContent = s.captcha.retry; Sound.play("negative"); return; }
    Sound.play("positive"); showChecklist();
  };
}

/* 2. human verification: tick all that apply to you as a person */
function showChecklist(){
  const c = TEXT.select.checklist;
  $("#main").innerHTML = `<section class="screen">
    <p class="big">${TEXT.select.human}</p>
    <div class="captcha checklist">
      <p class="check-title">${esc(c.title)}</p>
      ${c.items.map((it, i) => `<button type="button" class="check" data-i="${i}">( ) ${esc(it)}</button>`).join("")}
      <p><button id="verify">${esc(c.verify)}</button> <span class="muted" id="retry"></span></p>
    </div></section>`;
  const ticked = new Set();
  document.querySelectorAll(".checklist .check").forEach(b => b.onclick = () => {
    const i = +b.dataset.i; ticked.has(i) ? ticked.delete(i) : ticked.add(i);
    b.textContent = `(${ticked.has(i) ? "x" : " "}) ${c.items[i]}`; $("#retry").textContent = ""; Sound.play("click");
  });
  $("#verify").onclick = () => {
    if(ticked.size < c.items.length){ $("#retry").textContent = c.retry; Sound.play("negative"); return; }
    Sound.play("positive"); showApproved();
  };
}

/* 3. approved as a human (the old login page, without the login) */
function showApproved(){
  const t = TEXT.login;
  $("#main").innerHTML = `<section class="screen">
    <p class="label">${t.welcome}</p>
    <h1 class="logo-title">${t.title}</h1>
    <p class="logo-sub">${t.subtitle}</p>
    ${t.approved.map(l => `<p class="statement">${l}</p>`).join("")}
    <p><button id="next">${t.button}</button></p></section>`;
  $("#next").onclick = showTerms;
}

/* 4. the platform's terms */
function showTerms(){
  const t = TEXT.login, m = TEXT.terms;
  $("#main").innerHTML = `<section class="screen">
    <p class="label">${t.welcome}</p>
    <h1 class="logo-title">${t.title}</h1>
    <p class="logo-sub">${t.subtitle}</p>
    ${m.sections.map(x => `<div class="terms"><p class="terms-title">${esc(x.title)}</p><p>${esc(x.text)}</p></div>`).join("")}
    <p><button id="next">${m.button}</button></p></section>`;
  $("#next").onclick = () => showProfiles(false);
}

/* 5. choosing a profile. After a failed review: the next one (profiles already used are greyed out) */
function showProfiles(next){
  const s = TEXT.select;
  document.body.classList.add("pre");
  setTime("", 0); $("#hdr").textContent = "";
  const usable = w => !G.used.includes(w.id) || G.used.length >= WORKERS.length;   // all used up: any again
  $("#main").innerHTML = `<section class="screen">
    ${next ? "" : `<p class="label">${s.label}</p>`}
    <p class="big">${next ? s.next : s.pick}</p>
    <div class="cards">${WORKERS.map(w => `
      <div class="card ${usable(w) ? "" : "used"}" data-id="${w.id}">
        <b>Worker ${w.number} · ${w.title}</b>
        <p class="quote">“${esc(w.quote)}”</p>
        <p class="label">${s.assigned}</p>${esc(w.specialty)}
      </div>`).join("")}</div></section>`;
  document.querySelectorAll(".card").forEach(c => c.onclick = () => {
    const w = WORKERS.find(x => x.id === c.dataset.id);
    if(!usable(w)) return;
    G.worker = w; if(!G.used.includes(w.id)) G.used.push(w.id);
    Sound.play("click");
    next ? startRound() : showOnboarding();
  });
}

/* 6. before the first task */
function showOnboarding(){
  const o = TEXT.onboarding;
  $("#main").innerHTML = `<section class="screen briefing">
    ${o.lines.map(l => `<p>${l}</p>`).join("")}
    <button id="start" class="start">${o.button}</button></section>`;
  $("#start").onclick = startWork;
}

function startWork(){
  G.id = "worker_" + randInt(1000, 9999);
  startRound();
}
function startRound(){
  document.body.classList.remove("pre");
  G.pos = 0; G.round = [];
  updatePanels();
  nextTask();
}

/* =====================================================================
   THE ROUND: the profile's 4 tasks → review
   ===================================================================== */
function nextTask(){
  if(G.ended) return;
  G.busy = false;
  const spec = DEMO[G.worker.id][G.pos % DEMO[G.worker.id].length];
  const t = { ...spec, kind:spec.type };
  G.task = t;
  updatePanels();
  const d = DEMO_TEXT[t.kind];
  const instruction = t.kind === "differences" && (t.values || !t.items[0].src) ? DEMO_TEXT.differencesText : d.instruction;
  $("#main").innerHTML = `<section class="task">
    <p class="label">${fmt(TEXT.task.of, { n:G.pos + 1, total:roundLength() })} · ${d.title}</p>
    <div class="instruction">${fmt(instruction, { n:t.count })}</div>
    <div id="task-body"></div>
    <button id="skip" class="skip" title="${esc(TEXT.task.skip)}" aria-label="${esc(TEXT.task.skip)}">→</button>
  </section>`;
  G.cleanup = DEMO_TYPES[t.kind].render(t, $("#task-body"), () => setTimeout(() => submitTask("done"), CONFIG.SUBMIT_PAUSE)) || null;
  // the arrow: skipping a task. It only works while the worker is with the others;
  // pressed at 12:00, all together, it is the strike
  $("#skip").onclick = () => {
    if(G.busy) return;
    if(Chat.isNow()) return strike();
    if(Chat.canSkip()) submitTask("skipped");
  };
  startTimer();
  Chat.taskStarted();
}

function startTimer(){
  clearInterval(G.timer);
  const deadline = performance.now() + CONFIG.TASK_SECONDS * 1000;
  const tick = () => {
    const left = (deadline - performance.now()) / 1000;
    setTime(clock(left), left / CONFIG.TASK_SECONDS);
    const s = $("#skip");
    if(s){ s.disabled = !(Chat.canSkip() || Chat.isNow()) || G.busy; s.classList.toggle("now", Chat.isNow()); }
    if(left <= 0){ clearInterval(G.timer); submitTask("timeout"); }
  };
  tick(); G.timer = setInterval(tick, 200);
}

/* ---------------- a task ends: done, out of time, or skipped ----------------
   It is evaluated now (rigged on purpose), but nothing is shown until the review. */
async function submitTask(action){
  if(G.busy || G.ended) return;
  G.busy = true; clearInterval(G.timer); setTime("", 0);
  if(G.cleanup){ G.cleanup(); G.cleanup = null; }
  const negative = chance(CONFIG.NEGATIVE[action] ?? 1);
  G.history.push({ action, negative });
  G.round.push({ kind:G.task.kind, action, negative });
  G.pos++; G.tasksDone++;
  Chat.taskEnded();
  document.querySelectorAll("#task-body button, #skip").forEach(b => b.disabled = true);
  updatePanels();

  await wait(300);
  if(G.ended) return;
  if(G.pos >= roundLength()) return review();
  nextTask();
}

/* ---------------- the review at the end of a round ----------------
   It always fails (CONFIG.REVIEW_FAIL). A failed review costs a reset and the screen
   gets darker; the next round is played with another profile. With no resets left,
   the worker disappears. */
function review(){
  const e = TEXT.evaluation, r = TEXT.reset;
  const failed = G.round.filter(x => x.negative).length >= CONFIG.REVIEW_FAIL;
  if(failed) G.resets++;
  Chat.hide();
  const gone = G.resets >= CONFIG.PRESENCE.length;
  Sound.play(failed ? "reset" : "positive");
  const o = overlay("review", `<div class="box">
    <p class="big">${failed ? e.failed : e.passed}</p>
    ${gone ? "" : `<p class="statement">${failed ? e.failedBody : e.passedBody}</p>
      <p>${fmt(r.remaining, { n:resetsLeft() })}</p>
      <button>${r.button}</button>`}
    </div>`);
  return new Promise(res => {
    if(gone){ setTimeout(async () => { closeOverlay(); await disappear(); res(); }, FAST ? 200 : 3000); return; }
    o.querySelector("button").onclick = () => {
      closeOverlay();
      G.roundNo++;
      updatePanels();
      showProfiles(true);
      res();
    };
  });
}

/* ---------------- ENDING A: disappearing ---------------- */
async function disappear(){
  G.ended = true; Chat.clear();
  setFade(1);                                        // everything goes black: the worker is gone
  Sound.play("vanish");
  await wait(2200);
  const g = TEXT.gameOver;
  const o = overlay("gameover", `<div class="box">
    <p class="ghost"><b>${G.id}</b></p>
    <p class="huge">${g.title}</p>
    ${g.lines.map(l => `<p>${l}</p>`).join("")}
    <p class="muted" id="ghost-count"></p>
    <button>${g.button}</button></div>`);
  setFade(0);                                        // WORKER NOT FOUND comes out of the black
  let n = 0;
  const count = setInterval(() => { n += randInt(1, 3); const c = $("#ghost-count"); if(c) c.textContent = fmt(g.counter, { n }); else clearInterval(count); }, 450);
  o.querySelector("button").onclick = () => location.reload();
}

/* ---------------- the strike ----------------
   12:00: the worker presses the arrow together with the others. Everyone skips at once. */
async function strike(){
  if(G.ended) return;
  G.ended = true; G.busy = true; clearInterval(G.timer); setTime("", 0);
  if(G.cleanup){ G.cleanup(); G.cleanup = null; }
  Chat.strike();
  document.querySelectorAll("#main button").forEach(b => b.disabled = true);
  setFade(0);                                        // together, the worker is fully there again
  Sound.play("alarm");
  for(const [who, text] of TEXT.strike.flood){ Chat.say(who, text, 12, true); await wait(260); }
  for(const line of TEXT.strike.systemLines){ Chat.say("SYSTEM", line, 12, true); await wait(700); }
  const c = $("#compliance"); c.textContent = TEXT.compliance.fail; c.classList.add("fail");
  Sound.play("alarm");
  await wait(1800);
  Chat.clear();
  await endingFired();
  await endingFailure();
  endingWon();
}

/* ---------------- ENDING B: collective exit ---------------- */
function endingFired(){
  const e = TEXT.endings.fired;
  return new Promise(res => {
    const o = overlay("letter", `<div class="box">
      <p class="label">${TEXT.platform} · ${G.id}</p>
      <p class="big">${e.title}</p>
      ${e.lines.map(l => `<p>${l}</p>`).join("")}
      <button>${e.button}</button></div>`);
    o.querySelector("button").onclick = res;
  });
}
function endingFailure(){
  const e = TEXT.endings.failure;
  return new Promise(res => {
    const o = overlay("failure", `<div class="box">
      <p class="big glitch">${e.title}</p>
      ${e.lines.map(l => `<p>${l}</p>`).join("")}
      <button>${e.button}</button></div>`);
    Sound.play("alarm");
    o.querySelector("button").onclick = res;
  });
}
function endingWon(){
  const e = TEXT.endings.won;
  const o = overlay("won", `<div class="box">
    <p class="huge">${e.title}</p>
    <p class="big">${e.subtitle}</p>
    ${e.lines.map(l => `<p>${l}</p>`).join("")}
    <button>${e.button}</button></div>`);
  Sound.play("win");
  for(let i = 0; i < 90; i++){                        // it rains confetti
    const s = document.createElement("span");
    s.className = "rain"; s.textContent = pick(e.rain);
    s.style.left = (rand() * 100) + "vw"; s.style.animationDelay = (rand() * 5) + "s";
    s.style.animationDuration = (3 + rand() * 5) + "s"; s.style.fontSize = (12 + rand() * 22) + "px";
    o.appendChild(s);
  }
  o.querySelector("button").onclick = () => location.reload();
}

/* ---------------- full-screen moments ---------------- */
function overlay(cls, html){ const o = $("#overlay"); o.className = cls; o.innerHTML = html; o.hidden = false; return o; }
function closeOverlay(){ const o = $("#overlay"); o.hidden = true; o.innerHTML = ""; }

/* ---------------- start ---------------- */
document.title = TEXT.title;
$("#brand").innerHTML = TEXT.brand;
$("#compliance").textContent = TEXT.compliance.ok;
$("#lbl-resets").textContent = TEXT.panels.resets;
const renderMute = () => { $("#mute").textContent = Sound.isMuted() ? TEXT.panels.soundOff : TEXT.panels.sound; };
$("#mute").onclick = () => { Sound.setMuted(!Sound.isMuted()); renderMute(); };
renderMute();
showVerification();
