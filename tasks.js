/* =====================================================================
   TASKS
   The four kinds of task in the demo. The material for each profile is in DEMO (content.js).
   Each kind has render(task, element, done):
   - it draws the task inside element and lets the worker do it;
   - it calls done() when the task is finished (then the game moves on);
   - it may return a function that cleans up (stops timers) when the task is left early.
   An item is an image { src } or text { text } (drawn in the monospace font).
   ===================================================================== */

const rand = Math.random;
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const chance = p => rand() < p;
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* a String.raw text → list of lines (empty first/last lines removed) */
function lines(str){
  let l = String(str).replace(/\r/g, "").split("\n").map(s => s.replace(/\s+$/, ""));
  while(l.length && !l[0].trim()) l.shift();
  while(l.length && !l[l.length - 1].trim()) l.pop();
  return l;
}

/* what goes inside a square: an image or a text */
const itemHTML = it => it.src
  ? `<img src="${esc(it.src)}" alt="" draggable="false">`
  : `<pre class="art">${esc(lines(it.text).join("\n"))}</pre>`;

const DEMO_TYPES = {

  /* 1. the different element: click one, it dims, and the task is done */
  odd: {
    render(t, el, done){
      el.innerHTML = `<div class="grid2">${t.items.map((it, i) =>
        `<button type="button" class="cell" data-i="${i}">${itemHTML(it)}</button>`).join("")}</div>`;
      el.querySelectorAll(".cell").forEach(b => b.onclick = () => {
        if(t.answer !== undefined) return;
        t.answer = +b.dataset.i; b.classList.add("chosen"); Sound.play("click");
        done();
      });
    }
  },

  /* 2. match each image with its name: one option per row; done when every row has one */
  match: {
    render(t, el, done){
      t.answer = t.rows.map(() => null);
      el.innerHTML = t.rows.map((r, i) => `
        <div class="mrow">
          <div class="cell thumb">${itemHTML(r)}</div>
          <div class="mopts">${r.options.map((o, j) => `<button type="button" class="mopt" data-r="${i}" data-o="${j}">${esc(o)}</button>`).join("")}</div>
        </div>`).join("");
      el.querySelectorAll(".mopt").forEach(b => b.onclick = () => {
        if(t.finished) return;
        const r = +b.dataset.r;
        t.answer[r] = +b.dataset.o;
        el.querySelectorAll(`.mopt[data-r="${r}"]`).forEach(x => x.classList.toggle("picked", x === b));
        Sound.play("click");
        if(t.answer.every(a => a !== null)){ t.finished = true; done(); }
      });
    }
  },

  /* 3. memory grid: look, they disappear, put them back (click an image, then a square; or drag it) */
  memory: {
    render(t, el, done){
      el.innerHTML = `<div class="memory"><div class="grid2">${t.items.map((it, i) =>
        `<div class="cell slot" data-s="${i}">${itemHTML(it)}</div>`).join("")}</div><div class="tray"></div></div>`;
      const timer = setTimeout(hide, (FAST ? 0.3 : CONFIG.MEMORY_SECONDS) * 1000);
      const placed = t.items.map(() => null);          // slot → item index
      let selected = null;

      function hide(){
        el.querySelectorAll(".slot").forEach(s => { s.innerHTML = ""; s.classList.add("empty"); });
        const tray = el.querySelector(".tray");
        tray.innerHTML = shuffle(t.items.map((_, i) => i)).map(i =>
          `<div class="cell mini-cell" data-i="${i}" draggable="true">${itemHTML(t.items[i])}</div>`).join("");
        tray.querySelectorAll(".mini-cell").forEach(bindTray);
        el.querySelectorAll(".slot").forEach(s => {
          s.onclick = () => {
            const k = +s.dataset.s;
            if(placed[k] !== null){ returnToTray(k); return; }
            if(selected !== null) place(selected, k);
          };
          s.ondragover = e => e.preventDefault();
          s.ondrop = e => { e.preventDefault(); const i = +e.dataTransfer.getData("text/plain"); if(placed[+s.dataset.s] === null) place(i, +s.dataset.s); };
        });
        Sound.play("system");
      }
      function bindTray(c){
        c.onclick = () => {
          const i = +c.dataset.i;
          selected = selected === i ? null : i;
          el.querySelectorAll(".mini-cell").forEach(x => x.classList.toggle("selected", +x.dataset.i === selected));
          Sound.play("click");
        };
        c.ondragstart = e => e.dataTransfer.setData("text/plain", c.dataset.i);
      }
      function place(i, k){
        if(t.finished) return;
        placed[k] = i; selected = null;
        const s = el.querySelector(`.slot[data-s="${k}"]`);
        s.innerHTML = itemHTML(t.items[i]); s.classList.remove("empty");
        el.querySelector(`.mini-cell[data-i="${i}"]`)?.remove();
        Sound.play("click");
        if(placed.every(p => p !== null)){ t.finished = true; t.answer = placed.slice(); done(); }
      }
      function returnToTray(k){
        if(t.finished) return;
        const i = placed[k]; placed[k] = null;
        const s = el.querySelector(`.slot[data-s="${k}"]`); s.innerHTML = ""; s.classList.add("empty");
        const tray = el.querySelector(".tray");
        tray.insertAdjacentHTML("beforeend", `<div class="cell mini-cell" data-i="${i}" draggable="true">${itemHTML(t.items[i])}</div>`);
        bindTray(tray.lastElementChild);
      }
      return () => clearTimeout(timer);
    }
  },

  /* 4. find the differences: click on either image to mark a difference (click a mark to remove it).
        With text, click the characters. Done when all the differences asked for are marked. */
  differences: {
    render(t, el, done){
      const text = !t.items[0].src;
      t.marks = 0;
      el.innerHTML = `<div class="diffs">${t.items.map((it, i) => text
        ? `<div class="cell textdiff" data-p="${i}"><span class="formula">${[...it.text].map(c => `<span class="ch">${esc(c)}</span>`).join("")}</span></div>`
        : `<div class="cell imgdiff" data-p="${i}">${itemHTML(it)}</div>`).join("")}</div>
        <p class="muted marked"></p>`;
      const count = () => {
        el.querySelector(".marked").textContent = fmt(DEMO_TEXT.marked, { n:t.marks, total:t.count });
        if(t.marks >= t.count && !t.finished){ t.finished = true; done(); }
      };
      if(text){
        el.querySelectorAll(".ch").forEach(c => c.onclick = () => {
          if(t.finished) return;
          c.classList.toggle("picked"); t.marks += c.classList.contains("picked") ? 1 : -1;
          Sound.play("click"); count();
        });
      } else {
        el.querySelectorAll(".imgdiff").forEach(p => p.onclick = e => {
          if(t.finished) return;
          if(e.target.classList.contains("mark")){ e.target.remove(); t.marks--; Sound.play("click"); count(); return; }
          const r = p.getBoundingClientRect();
          const m = document.createElement("span");
          m.className = "mark";
          m.style.left = (e.clientX - r.left) + "px"; m.style.top = (e.clientY - r.top) + "px";
          p.appendChild(m); t.marks++; Sound.play("click"); count();
        });
      }
      count();
    }
  }
};
