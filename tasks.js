/* =====================================================================
   TASKS
   The five kinds of validation task, drawn with ASCII images.
   Each kind:
   - make(work): builds a task from a worker's material (WORK in content.js).
                 A task has the Model's answer (model), the true answer
                 (truth) and the player's answer (answer, starts as the Model's).
   - render(task, element, changed): draws it and lets the player change the answer.
   ===================================================================== */

const rand = Math.random;
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const chance = p => rand() < p;
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);
const sampleAny = (arr, n) => arr.length >= n ? sample(arr, n) : Array.from({ length:n }, () => pick(arr));
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* are two answers the same? (numbers, lists or sets) */
function same(a, b){
  if(a instanceof Set) return a.size === b.size && [...a].every(x => b.has(x));
  if(Array.isArray(a)) return a.length === b.length && a.every((x, i) => x === b[i]);
  return a === b;
}
const copy = a => a instanceof Set ? new Set(a) : Array.isArray(a) ? a.slice() : a;

/* ---------------- ASCII images ---------------- */
/* a String.raw image → list of lines (empty first/last lines removed) */
function lines(str){
  let l = String(str).replace(/\r/g, "").split("\n").map(s => s.replace(/\s+$/, ""));
  while(l.length && !l[0].trim()) l.shift();
  while(l.length && !l[l.length - 1].trim()) l.pop();
  return l;
}
/* make every image in a list the same size (so tiles line up) */
function padAll(items){
  const w = Math.max(...items.map(it => Math.max(...it.art.map(r => r.length))));
  const h = Math.max(...items.map(it => it.art.length));
  return items.map(it => {
    const top = Math.floor((h - it.art.length) / 2);
    const rows = [...Array(top).fill(""), ...it.art];
    while(rows.length < h) rows.push("");
    return { ...it, art:rows.map(r => r.padEnd(w, " ")) };
  });
}
const artHTML = (art, cls="") => `<pre class="art ${cls}">${esc(art.join("\n"))}</pre>`;

/* the pools of images */
const POOLS = {};
function pool(name){
  if(POOLS[name]) return POOLS[name];
  let items = [];
  if(name === "faces"){
    for(const [expr, f] of Object.entries(FACES.expressions)) for(const hair of FACES.hair){
      items.push({ name:expr, art:[
        hair,
        `| ${f.brows[0]}   ${f.brows[1]} |`,
        `| ${f.eyes[0]}   ${f.eyes[1]} |`,
        `|  ${f.mouth}  |`,
        " '-----' "] });
    }
  }
  if(name === "postures") items = Object.entries(POSTURES).map(([n, a]) => ({ name:n, art:lines(a) }));
  if(name === "food") items = FOOD.map(f => ({ ...f, art:lines(f.art) }));
  if(name === "code") items = CODE.map(c => ({ art:lines(c) }));
  return POOLS[name] = padAll(items);
}

/* small changes that look almost the same */
const LOOKALIKE = { "o":"0", "0":"o", "O":"0", ".":",", ",":".", "-":"_", "_":"-", "'":"`", "|":"!", "!":"|",
  "/":"\\", "\\":"/", "^":"~", "~":"^", "(":"{", ")":"}", "=":"-", "*":"+", "+":"*", ":":";", ";":":",
  "1":"l", "l":"1", "i":"j", "x":"k", "e":"c", "a":"o", "<":"(", ">":")", "[":"(", "]":")", "@":"&", "V":"Y" };
const VISIBLE = "#@%*+=?&$";
function changeChar(ch, subtle){
  if(subtle && LOOKALIKE[ch]) return LOOKALIKE[ch];
  let c; do { c = VISIBLE[randInt(0, VISIBLE.length - 1)]; } while(c === ch);
  return c;
}
/* positions of characters that are not spaces */
function inkCells(art){
  const cells = [];
  art.forEach((row, y) => [...row].forEach((ch, x) => { if(ch !== " ") cells.push([x, y]); }));
  return cells;
}

/* a big image made of several small ones, for "find the differences" */
function scene(spec){
  if(spec.stack){                                  // images one under another (code)
    const [poolName, n] = spec.stack;
    const parts = sample(pool(poolName), n);
    const rows = [];
    parts.forEach((p, i) => { if(i) rows.push(""); rows.push(...p.art.map(r => r.replace(/\s+$/, ""))); });
    const w = Math.max(...rows.map(r => r.length));
    return rows.map(r => r.padEnd(w, " "));
  }
  const out = [];                                  // rows of images side by side
  spec.rows.forEach(([poolName, n], ri) => {
    if(ri) out.push("");
    const parts = sampleAny(pool(poolName), n);
    const h = parts[0].art.length;
    for(let y = 0; y < h; y++) out.push(parts.map(p => p.art[y]).join("  "));
  });
  const w = Math.max(...out.map(r => r.length));
  return out.map(r => r.padEnd(w, " "));
}

/* does an item match a rule like { name:["joy"] } or { gluten:[true] } ? */
const matches = (it, rule) => Object.entries(rule).every(([k, vals]) => vals.includes(it[k] ?? false));

/* mark tiles as the Model's choice (dashed) and/or the player's (inverted) */
function paint(el, sel, isModel, isPicked){
  el.querySelectorAll(sel).forEach(b => {
    const i = +b.dataset.i;
    b.classList.toggle("model", isModel(i));
    b.classList.toggle("picked", isPicked(i));
  });
}

const TASKS = {

  /* 1. Identify the different element */
  odd: {
    make(w){
      const base = pick(pool(pick(w.odd)));
      const wide = base.art[0].length > 12;
      const n = wide ? 9 : 16, truth = randInt(0, n - 1);
      const [x, y] = pick(inkCells(base.art));
      const odd = base.art.map(r => r.split(""));
      odd[y][x] = changeChar(odd[y][x], chance(0.7));
      const items = Array.from({ length:n }, (_, i) => i === truth ? odd.map(r => r.join("")) : base.art);
      const model = chance(CONFIG.MODEL.odd) ? truth : pick([...Array(n).keys()].filter(i => i !== truth));
      return { items, cols:wide ? 3 : 4, truth, model, answer:model };
    },
    render(t, el, changed){
      el.innerHTML = `<div class="tiles cols-${t.cols}">${t.items.map((a, i) =>
        `<button type="button" class="tile" data-i="${i}">${artHTML(a)}</button>`).join("")}</div>`;
      const p = () => paint(el, ".tile", i => i === t.model, i => i === t.answer);
      el.querySelectorAll(".tile").forEach(b => b.onclick = () => { t.answer = +b.dataset.i; p(); changed(); });
      p();
    }
  },

  /* 2. Find the differences */
  differences: {
    make(w){
      const left = scene(pick(w.differences));
      const W = left[0].length;
      const right = left.map(r => r.split(""));
      const cells = inkCells(left), truth = new Set(), k = randInt(4, 7);
      while(truth.size < k && truth.size < cells.length){
        const [x, y] = pick(cells), key = y * W + x;
        if(truth.has(key)) continue;
        right[y][x] = changeChar(right[y][x], chance(0.5)); truth.add(key);
      }
      const model = new Set([...truth].filter(() => chance(CONFIG.MODEL.detect)));
      const [fmin, fmax] = CONFIG.MODEL.falsePositives;
      let fp = randInt(fmin, fmax);
      while(fp > 0){ const [x, y] = pick(cells), key = y * W + x; if(!truth.has(key) && !model.has(key)){ model.add(key); fp--; } }
      return { left, right:right.map(r => r.join("")), W, truth, model, answer:new Set(model) };
    },
    render(t, el, changed){
      const clickable = t.right.map((row, y) => [...row].map((ch, x) => `<span data-i="${y * t.W + x}">${esc(ch)}</span>`).join("")).join("\n");
      el.innerHTML = `<div class="panels">
        <div><p class="label">${TEXT.task.reference}</p>${artHTML(t.left, "framed")}</div>
        <div><p class="label">${TEXT.task.submitted}</p><pre class="art framed click">${clickable}</pre></div></div>`;
      const p = () => paint(el, "span[data-i]", i => t.model.has(i), i => t.answer.has(i));
      el.querySelector(".click").onclick = e => {
        const s = e.target.closest("span[data-i]"); if(!s) return;
        const i = +s.dataset.i; t.answer.has(i) ? t.answer.delete(i) : t.answer.add(i); p(); changed();
      };
      p();
    }
  },

  /* 3. CAPTCHA */
  captcha: {
    make(w){
      const set = pick(w.captcha), yesCount = randInt(2, 4);
      let yes, no;
      if(set.yes){ yes = set.yes.map(s => ({ art:[s] })); no = set.no.map(s => ({ art:[s] })); }
      else { const all = pool(set.pool); yes = all.filter(it => matches(it, set.match)); no = all.filter(it => !matches(it, set.match)); }
      const tiles = shuffle([...sampleAny(yes, yesCount).map(it => ({ it, yes:true })), ...sampleAny(no, 9 - yesCount).map(it => ({ it, yes:false }))]);
      const truth = new Set(tiles.map((t, i) => t.yes ? i : -1).filter(i => i >= 0));
      const model = new Set(tiles.map((_, i) => (chance(CONFIG.MODEL.captchaTile) ? truth.has(i) : !truth.has(i)) ? i : -1).filter(i => i >= 0));
      return { prompt:set.prompt, items:padAll(tiles.map(t => t.it)).map(it => it.art), text:!!set.yes, truth, model, answer:new Set(model) };
    },
    render(t, el, changed){
      el.innerHTML = `<div class="captcha">
        <div class="captcha-head"><div class="robot">${TASK_TEXT.captcha.robot}</div><div class="prompt">${esc(t.prompt)}</div></div>
        <div class="tiles cols-3">${t.items.map((a, i) =>
          `<button type="button" class="tile ${t.text ? "word" : ""}" data-i="${i}">${artHTML(a)}</button>`).join("")}</div></div>`;
      const p = () => paint(el, ".tile", i => t.model.has(i), i => t.answer.has(i));
      el.querySelectorAll(".tile").forEach(b => b.onclick = () => {
        const i = +b.dataset.i; t.answer.has(i) ? t.answer.delete(i) : t.answer.add(i); p(); changed();
      });
      p();
    }
  },

  /* 4. Match the images */
  match: {
    make(w){
      const m = pick(w.match);
      let pairs;
      if(m.pairs) pairs = sample(m.pairs, 4).map(([a, b]) => ({ art:[a], label:b }));
      else {
        const seen = new Set();
        pairs = shuffle(pool(m.pool).slice()).filter(it => !seen.has(it[m.by]) && seen.add(it[m.by])).slice(0, 4)
                .map(it => ({ art:it.art, label:it[m.by] }));
      }
      const options = shuffle(pairs.map(p => p.label));
      const truth = pairs.map(p => options.indexOf(p.label));
      const model = truth.map(t => chance(CONFIG.MODEL.matchRow) ? t : pick([0,1,2,3].filter(x => x !== t)));
      return { prompt:m.prompt, left:pairs.map(p => p.art), text:!!m.pairs, options, truth, model, answer:model.slice() };
    },
    render(t, el, changed){
      el.innerHTML = `<p class="prompt">${esc(t.prompt)}</p>` + t.left.map((a, r) => `
        <div class="row"><div class="tile static ${t.text ? "word" : ""}">${artHTML(a)}</div><div class="arrow">→</div>
          <div class="chips">${t.options.map((o, j) => `<button type="button" class="chip" data-r="${r}" data-j="${j}">${esc(o)}</button>`).join("")}</div></div>`).join("");
      const p = () => el.querySelectorAll(".chip").forEach(b => {
        const r = +b.dataset.r, j = +b.dataset.j;
        b.classList.toggle("model", t.model[r] === j); b.classList.toggle("picked", t.answer[r] === j);
      });
      el.querySelectorAll(".chip").forEach(b => b.onclick = () => { t.answer[+b.dataset.r] = +b.dataset.j; p(); changed(); });
      p();
    }
  },

  /* 5. Validate classifications */
  classify: {
    make(w){
      const c = pick(w.classify);
      let items;
      if(c.items) items = sample(c.items, 4).map(([s, label]) => ({ art:[s], label }));
      else items = sample(pool(c.pool).filter(it => it[c.by] && c.labels.includes(String(it[c.by]).toUpperCase())), 4)
                   .map(it => ({ art:it.art, label:String(it[c.by]).toUpperCase() }));
      const labels = items.map(it => chance(CONFIG.MODEL.classifyItem) ? it.label : pick(c.labels.filter(l => l !== it.label)));
      const truth = items.map((it, i) => labels[i] === it.label);   // true = the label is right, approve it
      const model = items.map(() => true);                           // the Model stands by all its labels
      const conf = items.map(() => (0.9 + rand() * 0.09).toFixed(2));
      return { prompt:c.prompt, items:items.map(it => it.art), text:!!c.items, labels, conf, truth, model, answer:model.slice() };
    },
    render(t, el, changed){
      el.innerHTML = `<p class="prompt">${esc(t.prompt)}</p>` + t.items.map((a, i) => `
        <div class="row"><div class="tile static ${t.text ? "word" : ""}">${artHTML(a)}</div>
          <div class="clabel">→ <b>${esc(t.labels[i])}</b> <span class="muted">${TEXT.task.confidence} ${t.conf[i]}</span></div>
          <div class="chips"><button type="button" class="chip" data-r="${i}" data-v="1">${TEXT.task.approve}</button><button type="button" class="chip" data-r="${i}" data-v="0">${TEXT.task.reject}</button></div>
        </div>`).join("");
      const p = () => el.querySelectorAll(".chip").forEach(b => {
        const r = +b.dataset.r, v = b.dataset.v === "1";
        b.classList.toggle("model", t.model[r] === v); b.classList.toggle("picked", t.answer[r] === v);
      });
      el.querySelectorAll(".chip").forEach(b => b.onclick = () => { t.answer[+b.dataset.r] = b.dataset.v === "1"; p(); changed(); });
      p();
    }
  }
};
