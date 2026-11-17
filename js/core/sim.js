import { $, st } from './state.js';

/* Caja de herramientas de simulación, con respaldo visual para cada señal */
let ctx;
export const sim = {
  on: false,
  say(t, o = {}) {
    $('#live').textContent = t;
    if (sim.on && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(t); const c = st.get('cfg', {}) || {}; u.lang = o.lang || c.lang || 'es-PE'; u.rate = o.rate || c.rate || 1.25;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  },
  tone(f = 660, d = .2, pan = 0, at = 0) {
    if (!sim.on) return;
    try {
      ctx ??= new AudioContext();
      const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.frequency.value = f; p.pan.value = pan; g.gain.value = .15;
      o.connect(g).connect(p).connect(ctx.destination);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + d);
    } catch { /* audio no disponible */ }
  },
  buzz(pattern, text, v) {
    const k = { Baja: .6, Media: 1, Alta: 1.5 }[v || (st.get('cfg', {}) || {}).vib || 'Media']; navigator.vibrate?.([].concat(pattern).map(x => Math.round(x * k)));
    const c = $('#chip'); c.textContent = 'Vibración: ' + text; c.hidden = false;
    clearTimeout(sim.t); sim.t = setTimeout(() => { c.hidden = true; }, 2500);
  }
};
