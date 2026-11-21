/* =====================================================================
   SOUND
   Small sounds made by the browser (no audio files).
   Browsers only allow sound after the first click.
   ===================================================================== */

const Sound = (() => {
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem("mhq-muted") === "1"; } catch(e) {}

  document.addEventListener("click", () => {
    if(ctx) { if(ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
  }, true);

  function tone(freq, dur, { type="sine", vol=0.2, at=0, to=null }={}){
    if(!ctx) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if(to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    click:    () => tone(1200, 0.03, { type:"square", vol:0.05 }),
    positive: () => { tone(660, 0.1); tone(990, 0.16, { at:0.09 }); },
    negative: () => tone(180, 0.35, { type:"sawtooth", vol:0.15, to:110 }),
    message:  () => { tone(880, 0.07, { vol:0.1 }); tone(1320, 0.09, { vol:0.08, at:0.07 }); },
    system:   () => tone(440, 0.12, { type:"square", vol:0.06 }),
    dialog:   () => { tone(523, 0.1, { vol:0.12 }); tone(784, 0.18, { vol:0.12, at:0.1 }); },
    rest:     () => { tone(392, 0.5, { vol:0.1 }); tone(523, 0.8, { vol:0.1, at:0.4 }); },
    reset:    () => [523, 440, 349, 262].forEach((f, i) => tone(f, 0.3, { type:"triangle", vol:0.15, at:i*0.18 })),
    vanish:   () => tone(600, 2.5, { vol:0.15, to:60 }),
    alarm:    () => { for(let i=0;i<6;i++) tone(i%2 ? 620 : 880, 0.18, { type:"square", vol:0.08, at:i*0.2 }); },
    win:      () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, { type:"triangle", vol:0.15, at:i*0.12 })),
    coin:     () => { tone(1568, 0.06, { type:"square", vol:0.04 }); tone(2093, 0.12, { type:"square", vol:0.04, at:0.05 }); }
  };

  function play(name){ if(!muted && ctx && SOUNDS[name]) SOUNDS[name](); }
  function setMuted(m){
    muted = m; try { localStorage.setItem("mhq-muted", m ? "1" : "0"); } catch(e) {}
    if(master) master.gain.value = m ? 0 : 0.5;
  }
  return { play, setMuted, isMuted: () => muted };
})();
