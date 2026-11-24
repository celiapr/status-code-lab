/* =====================================================================
   MESSAGES (popups)
   Two kinds, told apart by their look and their place:
   - SYSTEM (the company): square, white, with the platform's bar on top. Always in the same
     place, the top right corner. The wellbeing survey (SURVEY) comes now and then, on its own
     clock (CONFIG.SURVEY_FIRST, CONFIG.SURVEY_EVERY); its answers change nothing.
   - The workers (MESSAGES): rounded and grey, somewhere different each time, in the empty
     space next to the task, never on top of it. W5 writes privately, then the workers' chat,
     where they organise. Texts and order: content.js; timing: CONFIG.
   Both only move on while a task is on screen.
   - Answering a worker brings the player in with the others: the arrow (skip) works.
   - Turning them down, or leaving a question unanswered until the end of the next task: the arrow
     stops working, no workers' messages for CONFIG.QUIET_TASKS tasks, then the same message comes back.
   - The last message is the moment to press the arrow all together: the strike.
   ===================================================================== */

const Chat = (() => {
  const S = { idx:0, joined:false, quietUntil:0, active:false, activeMs:0, fresh:true, open:null, survey:null, now:false, started:false };
  const layer = () => document.getElementById("popups");
  const STEP = 100, GAP = 10, EDGE = 24;
  const isSystem = from => from === "SYSTEM";
  /* W1…W5 in content.js become a random number each game (W2939…), the same one all game long */
  const names = {};
  function label(from){
    if(!/^W\d$/.test(from)) return from;
    while(!names[from]){
      const n = "W" + randInt(1000, 9999);
      if(!Object.values(names).includes(n) && !G.id.endsWith(n.slice(1))) names[from] = n;
    }
    return names[from];
  }
  setInterval(() => { if(S.active) S.activeMs += FAST ? STEP * 8 : STEP; }, STEP);

  /* waiting: for a condition, or for some seconds of task time (the clock stops between tasks) */
  const until = fn => new Promise(res => { const iv = setInterval(() => { if(fn()){ clearInterval(iv); res(); } }, STEP); });
  const taskTime = s => { const end = S.activeMs + s * 1000; return until(() => S.activeMs >= end); };
  const ready = () => S.active && !G.ended && G.tasksDone + 1 >= CONFIG.POPUPS_FROM_TASK && G.tasksDone >= S.quietUntil;

  /* ---------------- the popups ---------------- */
  function popup(from, html, cls="", anywhere=false, bar=TEXT.popups.system){
    const p = document.createElement("div");
    if(isSystem(from)){
      p.className = "pop sys " + cls;
      p.innerHTML = `<div class="sys-bar">${esc(bar)}</div><p><span class="text">${html}</span></p>`;
    } else {
      p.className = "pop " + cls;
      p.innerHTML = `<p><span class="who">${esc(label(from))}</span><span class="text">${html}</span></p>`;
    }
    layer().appendChild(p);
    place(p, anywhere);
    requestAnimationFrame(() => p.classList.add("in"));
    return p;
  }
  function remove(p, after=0){
    setTimeout(() => { p.classList.remove("in"); p.classList.add("leaving"); setTimeout(() => { p.remove(); stackSystem(); }, 300); }, after);
  }
  function say(from, text, seconds=CONFIG.POPUP_STAY, anywhere=false){
    const p = popup(from, esc(text), "", anywhere);
    Sound.play(isSystem(from) ? "system" : "message");
    remove(p, (FAST ? 0.3 : seconds) * 1000);
    return p;
  }

  /* ---------------- where they go ---------------- */
  function contentRight(){
    const main = document.getElementById("main").getBoundingClientRect();
    let right = main.left + EDGE;
    document.querySelectorAll("#main .instruction, #main .cell, #main .mopt, #main .tray, #main .skip")
      .forEach(e => { right = Math.max(right, e.getBoundingClientRect().right); });
    return { right, top:main.top, left:main.left };
  }
  const overlaps = (a, b, m=GAP) => a.left < b.right + m && b.left < a.right + m && a.top < b.bottom + m && b.top < a.bottom + m;
  const live = () => [...layer().children].filter(o => !o.classList.contains("leaving"));

  /* SYSTEM: always the top right corner, one under the other */
  function stackSystem(){
    const { top } = contentRight();
    let y = top + EDGE;
    live().filter(p => p.classList.contains("sys")).forEach(p => {
      p.style.left = (innerWidth - p.offsetWidth - EDGE) + "px"; p.style.top = y + "px";
      y += p.offsetHeight + GAP;
    });
  }
  /* the corner kept free for SYSTEM: the workers never go there */
  function systemCorner(){
    const { top } = contentRight();
    const sys = live().filter(p => p.classList.contains("sys"));
    const bottom = sys.length ? Math.max(...sys.map(p => p.getBoundingClientRect().bottom)) : top + EDGE + 110;
    return { left:innerWidth - 300 - EDGE, right:innerWidth, top, bottom:Math.max(bottom, top + EDGE + 110) };
  }

  /* the workers: to the right of the task (anywhere: over the task too, for the end), somewhere
     different each time, not on top of another popup or of the SYSTEM corner */
  function place(p, anywhere=false){
    if(p.classList.contains("sys")) return stackSystem();
    let { right, top, left } = contentRight();
    if(anywhere) right = left - 40;
    const w = p.offsetWidth, h = p.offsetHeight, vw = innerWidth, vh = innerHeight;
    const x0 = right + 40, x1 = vw - w - EDGE, y0 = top + EDGE, y1 = vh - h - EDGE;
    const others = live().filter(o => o !== p).map(o => o.getBoundingClientRect());
    others.push(systemCorner());
    let x = Math.max(x0, x1), y = y0;                                   // narrow screen: as far right as possible
    for(let i = 0; i < 80; i++){
      const cx = x1 > x0 ? x0 + rand() * (x1 - x0) : x, cy = y0 + rand() * Math.max(0, y1 - y0);
      if(!others.some(o => overlaps(o, { left:cx, right:cx + w, top:cy, bottom:cy + h }))){ x = cx; y = cy; break; }
      if(i === 79){ y = y1 - (others.length * (h + GAP)) % Math.max(1, y1 - y0); }
    }
    p.style.left = Math.round(x) + "px"; p.style.top = Math.round(y) + "px";
  }
  /* a new task may be wider: move the workers' popups that would cover it */
  function makeRoom(){
    const { right } = contentRight();
    live().forEach(p => { if(!p.classList.contains("sys") && p.getBoundingClientRect().left < right + 20) place(p); });
    stackSystem();
  }

  /* ---------------- a question: YES / NO ----------------
     slot: "open" (a worker) or "survey" (the company), so both can wait at the same time */
  function ask(m, slot="open", bar){
    return new Promise(resolve => {
      const sys = isSystem(m.from);
      const p = popup(m.from, esc(m.text), "", false, bar);
      p.insertAdjacentHTML("beforeend", `<div class="btns"><button type="button">YES</button><button type="button">NO</button></div>`);
      place(p);
      Sound.play(sys ? "system" : "dialog");
      S[slot] = { p, shownAt:G.tasksDone, ignore:() => { remove(p); resolve(null); } };
      p.querySelectorAll(".btns button").forEach((b, i) => b.onclick = () => {
        S[slot] = null;
        const a = (i === 0 ? m.yes : m.no) || {};
        p.querySelector(".btns").remove();
        p.insertAdjacentHTML("beforeend", `<p class="you">you: ${i === 0 ? "YES" : "NO"}</p>`);
        place(p);
        Sound.play("click");
        if(a.reply) setTimeout(() => {
          p.insertAdjacentHTML("beforeend", sys
            ? `<p><span class="text">${esc(a.reply)}</span></p>`
            : `<p><span class="who">${esc(label(m.from))}</span><span class="text">${esc(a.reply)}</span></p>`);
          if(sys) stackSystem();
          Sound.play(sys ? "system" : "message");
        }, FAST ? 50 : 700);
        remove(p, (FAST ? 0.3 : a.reply ? 5 : 2) * 1000);
        resolve(a);
      });
    });
  }

  /* turning them down (or not answering): the arrow stops working and the workers go quiet for a while */
  function drop(){
    S.joined = false; S.fresh = true;
    S.quietUntil = G.tasksDone + (S.active ? 1 : 0) + CONFIG.QUIET_TASKS;
  }

  /* ---------------- the workers' messages, one after another ---------------- */
  async function run(){
    while(S.idx < MESSAGES.length){
      await until(ready);
      const m = MESSAGES[S.idx], asks = m.yes || m.no || m.now;
      await taskTime(S.fresh ? CONFIG.POPUP_FIRST : asks ? CONFIG.POPUP_GAP : CONFIG.POPUP_LINE_GAP);
      if(G.ended) return;
      if(!ready()) continue;
      S.fresh = false;

      if(m.now){                                          // 12:00: press the arrow, all together
        const p = popup(m.from, esc(m.text), "now");
        Sound.play("dialog");
        S.now = true;
        const pressed = await new Promise(res => { S.open = { p, shownAt:G.tasksDone, ignore:() => { remove(p); res(false); }, strike:() => res(true) }; });
        S.now = false;
        if(pressed) return;
        drop(); continue;
      }
      if(m.yes || m.no){
        const a = await ask(m);
        if(!a || a.drop){ drop(); continue; }             // the same message comes back later
        S.joined = true;
      } else {
        const p = say(m.from, m.text);
        if(m.withheld) setTimeout(() => p.classList.add("withheld"), FAST ? 50 : 1500);
      }
      S.idx++;
    }
  }

  /* ---------------- the company's survey, now and then ---------------- */
  async function surveys(){
    await taskTime(CONFIG.SURVEY_FIRST);
    for(let i = 0; !G.ended; i++){
      await until(() => S.active || G.ended);
      if(G.ended) return;
      await ask({ ...SURVEY[i % SURVEY.length], from:"SYSTEM" }, "survey", TEXT.popups.survey);
      await taskTime(CONFIG.SURVEY_EVERY);
    }
  }

  /* ---------------- called by the game ---------------- */
  function taskStarted(){
    S.active = true; layer().hidden = false;
    makeRoom();
    if(!S.started){ S.started = true; run(); surveys(); }
  }
  function taskEnded(){
    S.active = false;
    // a question left unanswered until the end of the task after the one it came in
    for(const slot of ["open", "survey"]){
      if(S[slot] && G.tasksDone >= S[slot].shownAt + 2){ const o = S[slot]; S[slot] = null; o.ignore(); }
    }
  }
  /* between rounds and on full screens: the popups go away (questions waiting come back with the next task) */
  function hide(){
    layer().hidden = true;
    const keep = [S.open && S.open.p, S.survey && S.survey.p];
    [...layer().children].forEach(p => { if(!keep.includes(p)) p.remove(); });
  }
  function clear(){ layer().innerHTML = ""; layer().hidden = true; }
  /* the arrow pressed at 12:00 */
  function strike(){
    const o = S.open; S.open = null; if(o && o.strike){ remove(o.p); o.strike(); }
    if(S.survey){ S.survey.p.remove(); S.survey = null; }
  }

  return { taskStarted, taskEnded, hide, clear, say, strike,
           canSkip: () => S.joined && G.tasksDone >= S.quietUntil, isNow: () => S.now };
})();
