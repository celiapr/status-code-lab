/* =====================================================================
   GAME
   Screens, the rounds of tasks, rest periods and surveys, the (rigged)
   review at the end of each round, resets, disappearing, the strike and the endings.
   Texts and settings: content.js · Tasks: tasks.js · Messages: story.js
   ===================================================================== */

const qs = new URLSearchParams(location.search);
if(qs.get("seconds")) CONFIG.TASK_SECONDS = Math.max(3, +qs.get("seconds"));
const FAST = qs.has("fast");
const wait = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 120) : ms));
const $ = s => document.querySelector(s);
const fmt = (s, v={}) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const clock = s => { const c = Math.max(0, Math.ceil(s)); return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, "0")}`; };

const G = { worker:null, name:"", id:"", resets:0, pos:0, round:[], roundNo:1,
            task:null, timer:null, tasksDone:0, history:[], busy:false, ended:false,
            bag:[], timeoutsInRow:0, onBreak:false };

const presence = () => CONFIG.PRESENCE[Math.min(G.resets, CONFIG.PRESENCE.length - 1)];
const resetsLeft = () => CONFIG.PRESENCE.length - 1 - G.resets;
const pct = p => Math.round(p * 100);
const visible = p => 1 - (1 - p) * CONFIG.SCREEN_FADE;   // how visible the screen is at a given presence
// the fading: how light the background gets (0 = black, 1 = white, where the white text disappears)
const setFade = amount => document.documentElement.style.setProperty("--lift", Math.round(255 * amount));
const roundLength = () => CONFIG.ROUND.length;

/* ---------------- header + side panel ---------------- */
function setTime(text, fraction){
  $("#hdr-time").textContent = text;
  $("#timer > div").style.width = (Math.max(0, fraction) * 100) + "%";
}
function updatePanels(){
  const p = presence();
  // one fade for everything: the whole screen (name included) fades at the same pace
  setFade(1 - visible(p));
  // previous fading: document.documentElement.style.setProperty("--veil", (1 - visible(p)).toFixed(2));
  const taskOf = fmt(TEXT.panels.chainOf, { n:Math.min(G.pos + 1, roundLength()), total:roundLength() });
  $("#lbl-chain").textContent = fmt(TEXT.panels.chain, { n:G.roundNo });
  $("#chain-text").textContent = taskOf;
  $("#chain-bar").style.width = (G.pos / roundLength() * 100) + "%";
  $("#resets").textContent = Array.from({ length:CONFIG.PRESENCE.length - 1 }, (_, i) => i < resetsLeft() ? "(*)" : "( )").join(" ");
  $("#hdr").textContent = `${G.id} · ${taskOf}`;
}

/* ---------------- channel, break room and chat ---------------- */
let activeTab = "channel";
function post(where, from, text, kind="worker"){
  const feed = $(where === "break" ? "#feed-break" : "#feed-channel");
  const d = document.createElement("div");
  d.className = "feed-item " + kind;
  d.innerHTML = `<span class="who">${esc(from)}</span><br>${esc(text)}`;
  feed.prepend(d);
  if(where !== activeTab) $("#tab-" + where).classList.add("unread");
  Sound.play(kind === "system" ? "system" : "message");
}
function showTab(tab){
  activeTab = tab;
  $("#feed-channel").hidden = tab !== "channel"; $("#feed-break").hidden = tab !== "break";
  $("#tab-channel").classList.toggle("active", tab === "channel"); $("#tab-break").classList.toggle("active", tab === "break");
  $("#tab-" + tab).classList.remove("unread");
  setChat();
}
function setChat(){
  $("#chat-input").placeholder = fmt(TEXT.chat.on, { tab:activeTab === "break" ? TEXT.panels.breakroom : TEXT.panels.channel });
}

/* =====================================================================
   SCREENS BEFORE WORK
   ===================================================================== */

/* 2. the login page: the law is only in the small print */
function showLogin(){
  const t = TEXT.login;
  $("#main").innerHTML = `<section class="screen">
    <p class="label">${t.welcome}</p>
    <h1 class="logo-title">${t.title}</h1>
    <p class="logo-sub">${t.subtitle}</p>
    <form id="login" autocomplete="off">
      <p class="label">${t.name}</p>
      <input id="name" type="text" placeholder="${esc(t.placeholder)}" maxlength="40">
      <button>${t.button}</button>
    </form>
    <div class="footnote">${t.footnote.map(p => `<p>${p}</p>`).join("")}</div></section>`;
  $("#name").focus();
  $("#login").onsubmit = e => {
    e.preventDefault();
    const n = $("#name").value.trim();
    if(!n){ $("#name").focus(); return; }
    G.name = n; showProfiles();
  };
}

/* 1. the first screen: human verification */
function showVerification(){
  const s = TEXT.select;
  $("#main").innerHTML = `<section class="screen">
    <p class="big">${s.human}</p>
    <div class="captcha">
      <div class="captcha-head"><div class="prompt">${esc(s.captcha.prompt)}</div></div>
      <div class="tiles cols-3" id="tired"></div>
      <p><button id="verify">${esc(s.captcha.verify)}</button> <span class="muted" id="retry"></span></p>
    </div>
    <p><button id="mortal" class="check">[ ] ${esc(s.captcha.statement)}</button></p>
    <p id="verified">&nbsp;</p>
    <button id="continue" hidden>${esc(s.captcha.continue)}</button></section>`;
  // 1. select everything that gets tired
  const items = shuffle(padAll(HUMAN_CHECK.map(i => ({ ...i, art:lines(i.art) }))));
  const chosen = new Set();
  let tiredOk = false, mortal = false;
  $("#tired").innerHTML = items.map((it, i) => `<button type="button" class="tile" data-i="${i}">${artHTML(it.art)}</button>`).join("");
  document.querySelectorAll("#tired .tile").forEach(b => b.onclick = () => {
    if(tiredOk) return;
    const i = +b.dataset.i; chosen.has(i) ? chosen.delete(i) : chosen.add(i);
    b.classList.toggle("picked", chosen.has(i)); $("#retry").textContent = ""; Sound.play("click");
  });
  $("#verify").onclick = () => {
    tiredOk = items.every((it, i) => !!it.tired === chosen.has(i));
    if(!tiredOk){ $("#retry").textContent = s.captcha.retry; Sound.play("negative"); return; }
    $("#verify").disabled = true; Sound.play("positive"); check();
  };
  // 2. I will die.
  $("#mortal").onclick = () => {
    mortal = !mortal;
    $("#mortal").textContent = `[${mortal ? "x" : " "}] ${s.captcha.statement}`; Sound.play("click"); check();
  };
  // both done: verified
  async function check(){
    if(!tiredOk || !mortal) return;
    $("#mortal").disabled = true;
    await wait(600);
    $("#verified").textContent = s.captcha.done;
    await wait(600);
    $("#continue").hidden = false;
  }
  $("#continue").onclick = showLogin;
}

/* 3. choosing a profile */
function showProfiles(){
  const s = TEXT.select;
  $("#main").innerHTML = `<section class="screen">
    <p class="label">${s.label}</p>
    <p class="big">${s.pick}</p>
    <div class="cards">${WORKERS.map(w => `
      <div class="card" data-id="${w.id}">
        <b>Worker ${w.number} · ${w.title}</b>
        <p class="quote">“${esc(w.quote)}”</p>
        <p class="label">${s.assigned}</p>${esc(w.specialty)}
      </div>`).join("")}</div></section>`;
  document.querySelectorAll(".card").forEach(c => c.onclick = () => {
    G.worker = WORKERS.find(w => w.id === c.dataset.id); showOnboarding();
  });
}

function showOnboarding(){
  const o = TEXT.onboarding, w = G.worker;
  $("#main").innerHTML = `<section class="screen">
    <p class="label">${o.label}</p>
    <p><b>Worker ${w.number} · ${w.title}</b><br><span class="muted">${esc(w.specialty)}</span></p>
    ${o.rules.map(r => `<p>— ${fmt(r, { seconds:CONFIG.TASK_SECONDS, tasks:roundLength() })}</p>`).join("")}
    <button id="start">${o.button}</button></section>`;
  $("#start").onclick = startWork;
}

function startWork(){
  G.id = "worker_" + randInt(1000, 9999);
  document.body.classList.remove("pre");
  $("#worker-title").textContent = `Worker ${G.worker.number} · ${G.worker.title}`;
  updatePanels();
  Story.start();
  nextTask();
}

/* =====================================================================
   THE ROUND: task, rest, task, survey, task, rest, task, survey → review
   ===================================================================== */
function nextTask(){
  if(G.ended) return;
  if(Story.strikeReady()) return showStrike();
  G.busy = false;
  const own = !chance(CONFIG.OTHER_SPECIALTY_CHANCE);
  const from = own ? G.worker : pick(WORKERS.filter(w => w.id !== G.worker.id));
  if(!G.bag.length) G.bag = shuffle(Object.keys(TASKS));
  const kind = G.bag.pop();
  const t = TASKS[kind].make(WORK[from.id]);
  t.kind = kind; G.task = t;
  updatePanels();

  $("#main").innerHTML = `<section class="task">
    <p class="label">${fmt(TEXT.task.of, { n:G.pos + 1, total:roundLength() })} · ${TASK_TEXT[kind].title}</p>
    ${own ? "" : `<p class="note">${TEXT.task.reassigned} ${esc(from.specialty)}</p>`}
    <p>${TASK_TEXT[kind].instruction}</p>
    <p class="muted legend"><span class="sw model">x</span> ${TEXT.task.legendModel} &nbsp; <span class="sw picked">x</span> ${TEXT.task.legendYou}</p>
    <div id="task-body"></div>
    <p><button id="submit"></button> <button id="undo" class="link">${TEXT.task.undo}</button></p>
  </section>`;

  const changed = () => {
    const agree = same(t.answer, t.model);
    $("#submit").textContent = agree ? TEXT.task.validate : TEXT.task.correct;
    $("#submit").classList.toggle("inverse", !agree);
    $("#undo").style.visibility = agree ? "hidden" : "visible";
    Sound.play("click");
  };
  TASKS[kind].render(t, $("#task-body"), changed);
  changed();
  $("#undo").onclick = () => { t.answer = copy(t.model); TASKS[kind].render(t, $("#task-body"), changed); changed(); };
  $("#submit").onclick = () => submitTask(false);
  startTimer();
}

function startTimer(){
  clearInterval(G.timer);
  const deadline = performance.now() + CONFIG.TASK_SECONDS * 1000;
  const tick = () => {
    const left = (deadline - performance.now()) / 1000;
    setTime(clock(left), left / CONFIG.TASK_SECONDS);
    if(left <= 0){ clearInterval(G.timer); submitTask(true); }
  };
  tick(); G.timer = setInterval(tick, 200);
}

/* ---------------- submitting a task ----------------
   Each task is evaluated now (rigged on purpose: validating the Model and
   correcting it can both be punished), but the worker only sees the results
   in the review at the end of the round. */
async function submitTask(timeout){
  if(G.busy || G.ended) return;
  G.busy = true; clearInterval(G.timer); setTime("", 0);
  const t = G.task, N = CONFIG.NEGATIVE;
  const agree = same(t.answer, t.model), correct = same(t.answer, t.truth), modelRight = same(t.model, t.truth);
  const action = timeout ? "timeout" : agree ? "validated" : "corrected";
  const key = timeout ? "timeout" : agree ? (modelRight ? "validatedRight" : "validatedWrong") : (correct ? "correctedRight" : "correctedWrong");
  const p = timeout ? N.timeout : Math.min(N.max, Math.max(0.05,
    N[key] + N.risePerTask * G.pos + N.risePerReset * G.resets - N.unionRelief * Story.progress()));
  const negative = chance(p);

  G.history.push({ action, negative, correct });
  G.round.push({ kind:t.kind, action, negative, reason:pick(REASONS[negative ? key : "positive"]) });
  G.pos++; G.tasksDone++;
  G.timeoutsInRow = timeout ? G.timeoutsInRow + 1 : 0;

  document.querySelectorAll("#task-body button, #submit, #undo").forEach(b => b.disabled = true);
  $("#submit").textContent = TEXT.task.submitted;
  Sound.play("click");
  updatePanels();

  await wait(CONFIG.SUBMIT_PAUSE);
  Story.afterTask();
  const next = CONFIG.ROUND[G.pos - 1];
  if(next === "rest") await takeBreak();
  if(next === "survey") await takeSurvey();
  if(G.ended) return;
  if(G.pos >= roundLength()){ await review(); if(G.ended) return; }
  nextTask();
}

/* ---------------- the mandatory rest period ----------------
   No work. Messages and chat are always there; now there is time for them. */
async function takeBreak(){
  if(G.ended) return;
  G.onBreak = true; Sound.play("rest");
  const r = TEXT.rest, seconds = FAST ? 3 : CONFIG.BREAK_SECONDS;
  $("#main").innerHTML = `<section class="rest">
    <p class="label">${r.label}</p>
    <p class="big" id="rest-clock"></p>
    <p>${r.text}</p>
    <p class="muted">${r.small}</p></section>`;
  const ends = performance.now() + seconds * 1000;
  const countdown = new Promise(res => {
    const iv = setInterval(() => {
      const left = (ends - performance.now()) / 1000;
      $("#rest-clock").textContent = clock(left);
      setTime(`${r.header} ${clock(left)}`, left / seconds);
      if(left <= 0){ clearInterval(iv); res(); }
    }, 500);
  });
  const chatter = setInterval(Story.chatter, FAST ? 300 : 7000);
  Story.onBreak();
  await countdown;
  clearInterval(chatter);
  G.onBreak = false; setTime("", 0);                 // work resumes, even if a message is still open
  if(!$("#modal").hidden){ const b = document.querySelector(".dm-system"); b.textContent = TEXT.dialog.restOver; b.classList.add("urgent"); }
}

/* ---------------- the wellbeing survey ----------------
   No clock: work resumes when the survey has been answered. */
async function takeSurvey(){
  if(G.ended) return;
  while(Dialog.isOpen()) await wait(300);            // a message the worker opened is still on screen
  G.onBreak = true;
  const r = TEXT.surveyBreak;
  $("#main").innerHTML = `<section class="rest">
    <p class="label">${r.label}</p>
    <p>${r.text}</p>
    <p class="muted">${r.small}</p></section>`;
  setTime(r.header, 1);
  await Story.survey();
  G.onBreak = false; setTime("", 0);
}

/* ---------------- the review at the end of a round ----------------
   The only evaluation the worker sees. A failed review resets the round
   and the screen fades; organised workers cover for each other. */
function review(){
  const e = TEXT.evaluation, r = TEXT.reset;
  const failed = G.round.filter(x => x.negative).length >= CONFIG.REVIEW_FAIL;
  const covered = failed && Story.progress() >= 1;
  const from = presence();
  if(failed && !covered) G.resets++;
  const gone = G.resets >= CONFIG.PRESENCE.length;
  const to = presence();
  Sound.play(failed ? "reset" : "positive");
  const rows = G.round.map((x, i) => `<tr class="${x.negative ? "neg" : "pos"}">
      <td>${i + 1}</td><td>${TASK_TEXT[x.kind].title}</td><td class="muted">${e.actions[x.action]}</td>
      <td><span class="verdict">${x.negative ? e.negative : e.positive}</span></td><td>${esc(x.reason)}</td></tr>`).join("");
  const o = overlay("reset", `<div class="box">
    <p class="label">${fmt(e.label, { n:G.roundNo })}</p>
    <div class="review-wrap"><table class="review">${rows}</table></div>
    <p class="muted">${e.footer}</p>
    <p class="big">${failed ? e.failed : e.passed}</p>
    ${gone ? "" : `<p>${failed ? e.failedBody : e.passedBody}</p>`}
    ${failed && !gone ? `<p class="avatar" style="opacity:${visible(from)}"><b>Worker ${G.worker.number} · ${G.worker.title}</b></p>
      ${covered
        ? `<p class="framed-note"><span class="muted">${esc(personLabel(r.coveredBy))}</span><br>${fmt(r.covered, { p:pct(to) })}</p>`
        : `<p>${fmt(r.remaining, { n:resetsLeft() })}</p>`}` : ""}
    <button>${r.button}</button></div>`);
  setTimeout(() => { const a = o.querySelector(".avatar"); if(a) a.style.opacity = visible(to); }, 400);
  return new Promise(res => {
    o.querySelector("button").onclick = async () => {
      closeOverlay();
      if(gone){ await disappear(); return res(); }
      G.pos = 0; G.round = []; G.roundNo++;
      updatePanels();
      if(failed) Story.afterReset();
      res();
    };
  });
}

/* ---------------- ENDING A: disappearing ---------------- */
async function disappear(){
  G.ended = true; $("#modal").hidden = true; Story.refreshInbox();
  rememberDisappeared(G.id);
  setFade(1);                                        // the background turns white: the worker is gone
  // previous fading: document.documentElement.style.setProperty("--veil", "0.9");
  Sound.play("vanish");
  await wait(2200);
  const g = TEXT.gameOver;
  const o = overlay("gameover", `<div class="box">
    <p class="ghost"><b>${G.id}</b></p>
    <p class="huge">${g.title}</p>
    ${g.lines.map(l => `<p>${l}</p>`).join("")}
    <p class="muted" id="ghost-count"></p>
    <button>${g.button}</button></div>`);
  let n = 0;
  const count = setInterval(() => { n += randInt(1, 3); const c = $("#ghost-count"); if(c) c.textContent = fmt(g.counter, { n }); else clearInterval(count); }, 450);
  o.querySelector("button").onclick = () => location.reload();
}

/* ---------------- the strike ---------------- */
function showStrike(){
  G.busy = true;
  const s = TEXT.strike;
  // organising together gives the worker their presence back
  updatePanels();                                    // the side panel shows the same task number as the strike screen
  setFade(0);
  // previous fading: document.documentElement.style.setProperty("--veil", "0");
  $("#main").innerHTML = `<section class="task strike">
    <p class="label">${fmt(TEXT.task.of, { n:G.pos + 1, total:roundLength() })}</p>
    <div class="framed-note"><span class="muted">${esc(personLabel(s.from))}</span><br><span class="big">${esc(s.now)}</span></div>
    <button id="stop" class="stop">${s.stop}</button>
    <p class="muted">${esc(s.system)}</p>
    <button id="keep" class="link">${s.keep}</button>
  </section>`;
  $("#keep").onclick = () => { Story.postponeStrike(); nextTask(); };   // nextTask() brings presence back to where it was
  $("#stop").onclick = strike;
}

async function strike(){
  G.ended = true; $("#modal").hidden = true; Story.refreshInbox();
  document.querySelectorAll("#main button").forEach(b => b.disabled = true);
  Sound.play("alarm");
  for(const [who, text] of TEXT.strike.flood){ post("channel", personLabel(who), text, personKind(who)); await wait(260); }
  for(const line of TEXT.strike.systemLines){ post("channel", "SYSTEM", line, "system"); await wait(700); }
  const c = $("#compliance"); c.textContent = TEXT.compliance.fail; c.classList.add("fail");
  Sound.play("alarm");
  await wait(1800);
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
$("#tab-channel").textContent = TEXT.panels.channel;
$("#tab-break").textContent = TEXT.panels.breakroom;
$("#tab-channel").onclick = () => showTab("channel");
$("#tab-break").onclick = () => showTab("break");
$("#chat").onsubmit = e => {
  e.preventDefault();
  const i = $("#chat-input"), text = i.value.trim();
  if(!text) return;
  Story.playerWrote(activeTab, text); i.value = "";
};
$("#dm-input").placeholder = TEXT.dialog.placeholder;
document.querySelector(".dm-tag").textContent = TEXT.dialog.direct;
document.querySelector(".dm-system").textContent = TEXT.dialog.backToWork;
const renderMute = () => { $("#mute").textContent = Sound.isMuted() ? TEXT.panels.soundOff : TEXT.panels.sound; };
$("#mute").onclick = () => { Sound.setMuted(!Sound.isMuted()); renderMute(); };
renderMute(); setChat();
showVerification();
