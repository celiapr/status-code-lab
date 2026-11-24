/* =====================================================================
   MESSAGES (popups)
   The company's survey, a worker writing privately (W5) and the workers' chat,
   where they organise. Texts and order: MESSAGES (content.js); timing: CONFIG.
   - The popups start during task CONFIG.POPUPS_FROM_TASK and only move on while a task is on screen.
   - They appear in the empty space next to the task, somewhere different each time, without covering it.
   - Answering a worker brings the player in with the others: the arrow (skip) works.
   - Turning them down, or leaving a question unanswered until the end of the next task: the arrow
     stops working, no messages for CONFIG.QUIET_TASKS tasks, then the same message comes back.
   - The last message is the moment to press the arrow all together: the strike.
   ===================================================================== */

const Chat = (() => {
  const S = { idx:0, joined:false, quietUntil:0, active:false, activeMs:0, fresh:true, open:null, now:false, started:false };
  const layer = () => document.getElementById("popups");
  const STEP = 100;
  setInterval(() => { if(S.active) S.activeMs += FAST ? STEP * 8 : STEP; }, STEP);

  /* waiting: for a condition, or for some seconds of task time (the clock stops between tasks) */
  const until = fn => new Promise(res => { const iv = setInterval(() => { if(fn()){ clearInterval(iv); res(); } }, STEP); });
  const taskTime = s => { const end = S.activeMs + s * 1000; return until(() => S.activeMs >= end); };
  const ready = () => S.active && !G.ended && G.tasksDone + 1 >= CONFIG.POPUPS_FROM_TASK && G.tasksDone >= S.quietUntil;

  /* ---------------- the popups ---------------- */
  function popup(from, html, cls="", anywhere=false){
    const p = document.createElement("div");
    p.className = "pop " + cls;
    p.innerHTML = `<p><span class="who">${esc(from)}</span><span class="text">${html}</span></p>`;
    layer().appendChild(p);
    place(p, anywhere);
    requestAnimationFrame(() => p.classList.add("in"));
    return p;
  }
  function remove(p, after=0){
    setTimeout(() => { p.classList.remove("in"); p.classList.add("leaving"); setTimeout(() => p.remove(), 300); }, after);
  }
  function say(from, text, seconds=CONFIG.POPUP_STAY, anywhere=false){
    const p = popup(from, esc(text), "", anywhere);
    Sound.play(from === "SYSTEM" ? "system" : "message");
    remove(p, (FAST ? 0.3 : seconds) * 1000);
    return p;
  }

  /* where a popup can go: to the right of the task, below the header, not on top of another popup
     (anywhere: over the task too; for the end, when everyone skips) */
  function contentRight(){
    const main = document.getElementById("main").getBoundingClientRect();
    let right = main.left + 24;
    document.querySelectorAll("#main .instruction, #main .cell, #main .mopt, #main .tray, #main .skip, #main .framed-note")
      .forEach(e => { right = Math.max(right, e.getBoundingClientRect().right); });
    return { right, top:main.top };
  }
  const overlaps = (a, b, m=10) => a.left < b.right + m && b.left < a.right + m && a.top < b.bottom + m && b.top < a.bottom + m;
  function place(p, anywhere=false){
    let { right, top } = contentRight();
    if(anywhere) right = document.getElementById("main").getBoundingClientRect().left - 40;
    const w = p.offsetWidth, h = p.offsetHeight, vw = innerWidth, vh = innerHeight;
    const x0 = right + 40, x1 = vw - w - 24, y0 = top + 24, y1 = vh - h - 24;
    const others = [...layer().children].filter(o => o !== p && !o.classList.contains("leaving")).map(o => o.getBoundingClientRect());
    let x = Math.max(x0, x1), y = y0;                                   // narrow screen: as far right as possible
    for(let i = 0; i < 60; i++){
      const cx = x1 > x0 ? x0 + rand() * (x1 - x0) : x, cy = y0 + rand() * Math.max(0, y1 - y0);
      if(!others.some(o => overlaps(o, { left:cx, right:cx + w, top:cy, bottom:cy + h }))){ x = cx; y = cy; break; }
      if(i === 59){ y = y0 + (others.length * (h + 10)) % Math.max(1, y1 - y0); }
    }
    p.style.left = Math.round(x) + "px"; p.style.top = Math.round(y) + "px";
  }
  /* a new task may be wider: move the popups that would cover it */
  function makeRoom(){
    const { right } = contentRight();
    [...layer().children].forEach(p => { if(p.getBoundingClientRect().left < right + 20) place(p); });
  }

  /* ---------------- a question: YES / NO ---------------- */
  function ask(m){
    return new Promise(resolve => {
      const p = popup(m.from, esc(m.text));
      p.insertAdjacentHTML("beforeend", `<div class="btns"><button type="button">YES</button><button type="button">NO</button></div>`);
      place(p);
      Sound.play(m.from === "SYSTEM" ? "system" : "dialog");
      S.open = { p, shownAt:G.tasksDone, ignore:() => { remove(p); resolve(null); } };
      p.querySelectorAll(".btns button").forEach((b, i) => b.onclick = () => {
        S.open = null;
        const a = (i === 0 ? m.yes : m.no) || {};
        p.querySelector(".btns").remove();
        p.insertAdjacentHTML("beforeend", `<p class="you">you: ${i === 0 ? "YES" : "NO"}</p>`);
        Sound.play("click");
        if(a.reply) setTimeout(() => {
          p.insertAdjacentHTML("beforeend", `<p><span class="who">${esc(m.from)}</span><span class="text">${esc(a.reply)}</span></p>`);
          Sound.play(m.from === "SYSTEM" ? "system" : "message");
        }, FAST ? 50 : 700);
        remove(p, (FAST ? 0.3 : a.reply ? 5 : 2) * 1000);
        resolve(a);
      });
    });
  }

  /* turning them down (or not answering): the arrow stops working and the messages stop for a while */
  function drop(){
    S.joined = false; S.fresh = true;
    S.quietUntil = G.tasksDone + (S.active ? 1 : 0) + CONFIG.QUIET_TASKS;
  }

  /* ---------------- the messages, one after another ---------------- */
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
        if(m.survey){ S.idx++; continue; }                // the company's survey: nothing changes
        if(!a || a.drop){ drop(); continue; }             // the same message comes back later
        S.joined = true;
      } else {
        const p = say(m.from, m.text);
        if(m.withheld) setTimeout(() => p.classList.add("withheld"), FAST ? 50 : 1500);
      }
      S.idx++;
    }
  }

  /* ---------------- called by the game ---------------- */
  function taskStarted(){
    S.active = true; layer().hidden = false;
    makeRoom();
    if(!S.started){ S.started = true; run(); }
  }
  function taskEnded(){
    S.active = false;
    // a question left unanswered until the end of the task after the one it came in
    if(S.open && G.tasksDone >= S.open.shownAt + 2){ const o = S.open; S.open = null; o.ignore(); }
  }
  /* between rounds and on full screens: the popups go away (a question waiting comes back with the next task) */
  function hide(){
    layer().hidden = true;
    [...layer().children].forEach(p => { if(!S.open || p !== S.open.p) p.remove(); });
  }
  function clear(){ layer().innerHTML = ""; layer().hidden = true; }
  /* the arrow pressed at 12:00 */
  function strike(){ const o = S.open; S.open = null; if(o && o.strike){ remove(o.p); o.strike(); } }

  return { taskStarted, taskEnded, hide, clear, say, strike,
           canSkip: () => S.joined && G.tasksDone >= S.quietUntil, isNow: () => S.now };
})();
