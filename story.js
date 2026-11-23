/* =====================================================================
   STORY
   Messages from other workers, the "Everything OK at work?" question,
   the steps towards the union (during rest periods) and the chat.
   All texts are in STORY (content.js).
   ===================================================================== */

/* ---------------- who is talking ---------------- */
function personLabel(key){
  const p = PEOPLE[key];
  if(!p) return key;                                   // a plain ID such as "worker_0311"
  if(key === "system") return "SYSTEM";
  return p.disappeared ? `${p.id} [disappeared]` : `${p.name} · ${p.id}`;
}
function personKind(key){
  const p = PEOPLE[key];
  return key === "system" ? "system" : p && p.disappeared ? "ghost" : "worker";
}

/* ---------------- reading what the player types ----------------
   The answer is matched against each option's keywords (the last option
   is checked first, so "not ok" counts as NO and not as OK). */
function interpret(text, options){
  const t = " " + text.toLowerCase().replace(/[’`]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, " ") + " ";
  for(let i = options.length - 1; i >= 0; i--){
    for(const kw of options[i].keywords || []){
      if(kw.includes("'") ? t.includes(kw) : new RegExp(`[^\\p{L}]${kw}[^\\p{L}]`, "u").test(t)) return i;
    }
  }
  return -1;
}

/* =====================================================================
   DIALOG: the notification window where workers write to the player
   ===================================================================== */
const Dialog = (() => {
  const box = () => document.getElementById("modal");
  let isOpen = false;

  function open(from, tag=TEXT.dialog.direct, note=""){
    const m = box();
    m.querySelector(".dm-tag").textContent = tag;
    const sys = m.querySelector(".dm-system"); sys.textContent = TEXT.dialog.backToWork; sys.classList.remove("urgent");
    m.querySelector(".dm-note").textContent = note;
    m.querySelector(".dm-who").textContent = personLabel(from);
    m.querySelector(".dm-hints").innerHTML = "";
    m.querySelector(".dm-extra").innerHTML = "";
    m.querySelector(".dm-interpret").textContent = "";
    m.hidden = false; isOpen = true;
    Sound.play("dialog");
  }
  function close(){ box().hidden = true; isOpen = false; Story.refreshInbox(); }

  /* ask a question with two options; the player can click or type.
     fallback: option chosen when the typed text is unclear (null = ask again)
     systemChoice: option chosen by the platform's "back to work" link
     freeText: any typed text counts as the first option (used to sign) */
  function ask({ from, text, hints=[], options, fallback=null, systemChoice=1, freeText=false, tag, note }){
    return new Promise(resolve => {
      open(from, tag, note);
      const m = box();
      m.querySelector(".dm-text").textContent = text;
      const input = m.querySelector("#dm-input");
      input.value = ""; input.disabled = false; input.hidden = false;
      const buttons = m.querySelector(".dm-buttons");
      buttons.innerHTML = options.map((o, i) => `<button type="button" class="opt" data-i="${i}">${esc(o.label)}</button>`).join("");

      // hints from other workers appear one by one
      const hb = m.querySelector(".dm-hints");
      if(hints.length) hb.innerHTML = `<p class="label">${TEXT.dialog.hintsFrom}</p>`;
      hints.forEach(([who, line], i) => setTimeout(() => {
        if(m.hidden) return;
        const d = document.createElement("div");
        d.className = "hint " + personKind(who);
        d.innerHTML = `<span class="who">${esc(personLabel(who))}</span> ${esc(line)}`;
        hb.appendChild(d); Sound.play("message");
      }, (FAST ? 50 : 700) * (i + 1)));

      let done = false;
      const finish = (i, typed="", note="") => {
        if(done) return; done = true;
        input.disabled = true;
        if(note) m.querySelector(".dm-interpret").textContent = note;
        setTimeout(() => { close(); resolve({ choice:i, text:typed }); }, note ? (FAST ? 100 : 1300) : 150);
      };
      buttons.querySelectorAll(".opt").forEach(b => b.onclick = () => finish(+b.dataset.i));
      m.querySelector(".dm-system").onclick = () => finish(systemChoice);
      m.querySelector(".dm-form").onsubmit = e => {
        e.preventDefault();
        const typed = input.value.trim(); if(!typed) return;
        let i = interpret(typed, options);
        if(freeText && i === -1) i = 0;
        if(i >= 0) return finish(i, typed, fmt(TEXT.dialog.interpreted, { answer:options[i].label }));
        if(fallback !== null) return finish(fallback, typed, fmt(TEXT.dialog.normalised, { answer:options[fallback].label }));
        m.querySelector(".dm-interpret").textContent = `${PEOPLE[from]?.name || ""}: ${TEXT.dialog.unclear}`;
        input.value = "";
      };
      setTimeout(() => input.focus(), 50);
    });
  }

  /* show something with a single button */
  function show({ from, text, html="", button=TEXT.dialog.close, after=null }){
    return new Promise(resolve => {
      open(from);
      const m = box();
      m.querySelector(".dm-text").textContent = text || "";
      m.querySelector(".dm-extra").innerHTML = html;
      m.querySelector("#dm-input").hidden = true;
      m.querySelector(".dm-buttons").innerHTML = `<button type="button" class="opt">${esc(button)}</button>`;
      m.querySelector(".dm-buttons .opt").onclick = () => { close(); resolve(); };
      m.querySelector(".dm-system").onclick = () => { close(); resolve(); };
      if(after) after(m);
    });
  }

  return { ask, show, isOpen: () => isOpen };
})();

/* =====================================================================
   STORY: the messages that appear after tasks, and the road to the union
   ===================================================================== */
const Story = (() => {
  // saidNo: the coworkers' messages are on (from the start now that there is no survey)
  // joined: the worker has accepted a coworker's message at least once (the skip arrow works from then on)
  const S = { saidNo:true, joined:false, asks:0, step:0, cold:false, nextStepAt:0, offered:[], strikeReady:false,
              breakroomOpen:false, breakroomIdx:0, channelIdx:0, ghostIdx:0, pastPosted:false, chatReplyIdx:0,
              pending:false };          // pending: a union message waiting to be read
  const level = () => Math.min(G.resets, 3);
  const where = () => S.breakroomOpen ? "break" : "channel";
  const say = (place, [who, text]) => post(place, personLabel(who), fmt(text, { id:G.id, name:G.name }), personKind(who));

  function start(){ STORY.start.forEach(m => say("channel", m)); refreshInbox(); }

  /* ---------------- the inbox: a waiting message, always there ---------------- */
  function refreshInbox(){
    const box = document.getElementById("inbox");
    if(!S.pending || Dialog.isOpen() || G.ended){ box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `${esc(fmt(TEXT.inbox.text, { who:personLabel(STORY.union[S.step].from) }))} <button class="mini">${TEXT.inbox.open}</button>`;
    box.querySelector("button").onclick = openPending;
  }
  function setPending(){ S.pending = true; refreshInbox(); Sound.play("dialog"); }
  async function openPending(){
    if(!S.pending || Dialog.isOpen() || G.ended) return;
    S.pending = false; refreshInbox();
    await unionStep();
  }

  /* messages that appear on their own after each task */
  function afterTask(){
    if(chance(CONFIG.GHOST_MESSAGE_CHANCE[level()])){
      const l = STORY.ghosts[level()];
      say("channel", l[S.ghostIdx++ % l.length]);
    } else if(S.channelIdx < STORY.channel.length && chance(0.35)){
      say("channel", STORY.channel[S.channelIdx++]);
    }
    if(S.breakroomOpen && chance(0.5)) chatter();
    if(G.timeoutsInRow === 2) say("channel", STORY.sabotage);
    // a player who disappeared in an earlier game on this computer
    if(!S.pastPosted && G.tasksDone >= 3){
      const past = pastPlayers(); S.pastPosted = true;
      if(past.length) post("channel", `${pick(past)} [disappeared]`, pick(STORY.pastPlayers), "ghost");
    }
    // the next union message arrives
    if(S.saidNo && !S.pending && !S.strikeReady && S.step < STORY.union.length && G.tasksDone >= S.nextStepAt) setPending();
  }

  function afterReset(){
    say("channel", STORY.afterReset[Math.max(0, Math.min(G.resets - 1, STORY.afterReset.length - 1))]);
  }

  /* the break room chatters */
  function chatter(){
    if(S.cold) return;                                     // after turning them down, the break room goes quiet
    if(S.breakroomOpen && S.breakroomIdx < STORY.breakroom.length) say("break", STORY.breakroom[S.breakroomIdx++]);
  }

  /* a rest period: now there is time. A waiting message opens by itself. */
  function onBreak(){
    setTimeout(async () => {
      if(Dialog.isOpen() || G.ended || !G.onBreak) return;
      if(S.pending) await openPending();
    }, FAST ? 100 : 1500);
  }

  /* the company's wellbeing survey: "Everything OK at work?"
     Asked in every survey slot. Only the first NO changes anything. */
  async function survey(){
    const q = STORY.question;
    if(!S.saidNo){
      // one message from another worker, outside the survey, in the channel: you have to notice it
      const pool = q.hints[Math.min(S.asks + G.resets, q.hints.length - 1)];
      const hint = pool[S.asks % pool.length];
      setTimeout(() => say("channel", hint), FAST ? 50 : 1200);
    }
    const res = await Dialog.ask({
      from:q.from, tag:TEXT.dialog.survey, note:q.note,
      text:q.texts[Math.min(S.asks, q.texts.length - 1)],
      options:[q.yes, q.no], fallback:0, systemChoice:0
    });
    S.asks++;
    say("channel", res.choice === 1 ? q.afterNo : q.afterYes);
    if(res.choice === 1 && !S.saidNo){
      S.saidNo = true; S.cold = false;                     // back with the others, from the step they turned down
      await wait(800);
      await unionStep();                                   // a worker writes right away
    }
  }

  /* one step towards the union */
  async function unionStep(){
    const st = STORY.union[S.step];
    const res = await Dialog.ask({
      from:st.from, text:S.offered[S.step] && st.again ? st.again : st.text,
      options:[st.accept, st.decline], fallback:null, systemChoice:1, freeText:!!st.freeText
    });
    if(res.choice === 0){
      S.joined = true; S.cold = false;
      await doAction(st.action, res.text);
      if(st.reply) say(where(), [st.from, st.reply]);
      S.step++;
      S.nextStepAt = G.tasksDone + 1;
      if(S.step === STORY.union.length) S.strikeReady = true;
    } else {
      S.offered[S.step] = true;
      say(where(), [st.from, st.declineReply]);
      // turning them down: the break room goes quiet and nobody covers for the worker any more,
      // until they accept again. The message comes back a couple of tasks later.
      S.cold = true;
      S.nextStepAt = G.tasksDone + CONFIG.UNION_REOFFER_AFTER;
    }
  }

  async function doAction(action, typed){
    if(action === "breakroom"){
      S.breakroomOpen = true;
      document.getElementById("tab-break").hidden = false;
      chatter();
    }
    if(action === "share"){
      const sh = STORY.share;
      const all = G.history;
      const cell = all.length ? fmt(sh.format, { pct:Math.round(100 * all.filter(h => h.negative).length / all.length) }) : sh.none;
      const rows = [...sh.rows, [sh.you, cell]];
      await Dialog.show({ from:"kwame", text:sh.title,
        html:`<table class="share"><tr class="muted">${sh.header.map(h => `<td>${esc(h)}</td>`).join("")}</tr>${rows.map((r, i) => `<tr class="${i === rows.length - 1 ? "you" : ""}">${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>
              <p><b>${esc(sh.conclusion)}</b></p>` });
    }
    if(action === "sign"){
      const name = typed || G.name || G.id;
      await Dialog.show({ from:"marisol", text:STORY.sign.counting,
        html:`<div class="card-sign">${esc(name)}</div>`,
        after:m => setTimeout(() => { m.querySelector(".dm-text").textContent = STORY.sign.done; Sound.play("positive"); }, FAST ? 50 : 1200) });
    }
  }

  function postponeStrike(){
    S.strikeReady = false; S.step = STORY.union.length - 1; S.offered[S.step] = true;
    S.nextStepAt = G.tasksDone + 1;
    say(where(), STORY.strikePostponed);
  }

  /* the player writes in the chat (any time; only in a rest period is there time for it) */
  function playerWrote(place, text){
    const c = STORY.chat;
    const monitored = place === "channel" && interpret(text, [{ keywords:c.monitoredWords }]) === 0;
    post(place, `${TEXT.chat.you} · ${G.id}`, monitored ? c.withheld : text, monitored ? "withheld" : "me");
    const replies = place === "break" ? c.breakroomReplies : c.channelReplies;
    if(place === "break" && S.cold) return;               // nobody answers
    if(place === "break" || chance(0.6)) setTimeout(() => say(place, replies[S.chatReplyIdx++ % replies.length]), FAST ? 100 : 1800);
  }

  return { start, afterTask, afterReset, chatter, onBreak, survey, postponeStrike, playerWrote, refreshInbox,
           strikeReady: () => S.strikeReady, progress: () => S.cold ? 0 : S.step, joined: () => S.joined };
})();

/* ---------------- players who disappeared before, on this computer ---------------- */
function pastPlayers(){ try { return JSON.parse(localStorage.getItem("mhq-disappeared") || "[]"); } catch(e){ return []; } }
function rememberDisappeared(id){
  try { const l = pastPlayers(); l.push(id); localStorage.setItem("mhq-disappeared", JSON.stringify(l.slice(-10))); } catch(e){}
}
