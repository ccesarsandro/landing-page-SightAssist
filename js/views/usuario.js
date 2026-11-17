import { $, st, hhmm, HIST0, getSession, updateSession } from '../core/state.js';
import { sim } from '../core/sim.js';
import { run, app } from '../core/app.js';

/* Módulo B · App del usuario con discapacidad visual (vistas 17 a 24) */
const DESTINOS = ['Ventanilla 1', 'Ventanilla 3', 'Consultorio 2', 'SS.HH. Piso 1'];
const FRECUENTES = [['Ventanilla 3', 'Ventanillas'], ['Consultorio 2', 'Consultorios'], ['SS.HH. Piso 1', 'SS.HH.']];
const SERV = { baño: ['SS.HH.', 18], salida: ['Salida', 24], ascensor: ['Ascensor', 12] };
const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
const voz = t => `<p class="voz"><span aria-hidden="true">🔊</span> ${t}</p>`;

/* Reconocimiento de voz real si el navegador lo permite; si no, se simula */
const escuchar = (alTexto, simulado) => {
  sim.tone(520, .15);
  if (!SR) { setTimeout(() => alTexto(simulado), 1200); return; }
  const r = new SR(); r.lang = 'es-PE';
  r.onresult = e => alTexto(e.results[0][0].transcript.toLowerCase()); r.onerror = () => alTexto(''); r.start();
};

export const usuarioViews = {
  perfil: { // HU-001, HU-008 · vista 17
    h() {
      const c = st.get('cfg', {}) || {};
      const session = getSession(), nombre = session.name || 'Rosa Mendoza', correo = session.email || 'rosa.mendoza@correo.com';
      const visitas = st.get('hist', HIST0()).length, destino = st.get('dest', 'Sin destino seleccionado');
      return `<h1>Tu perfil</h1><section class="profile-hero"><div class="avatar" aria-hidden="true">${nombre.slice(0, 1).toUpperCase()}</div><div><p class="eyebrow">USUARIO PRINCIPAL</p><h2>${nombre}</h2><p>${correo}</p><span class="badge ok">● Cuenta activa</span></div></section>
        <div class="profile-grid"><section class="card"><div class="section-heading"><div><h2>Resumen de uso</h2><p class="section-subtitle">Tu actividad en SightAssist.</p></div><span class="menu-icon" aria-hidden="true">◉</span></div><dl class="kv"><dt>Trayectos registrados</dt><dd>${visitas}</dd><dt>Último destino</dt><dd>${destino}</dd><dt>Lector de pantalla</dt><dd class="ok">Activo</dd></dl></section>
        <section class="card"><div class="section-heading"><div><h2>Accesibilidad</h2><p class="section-subtitle">Preferencias actuales.</p></div><span class="menu-icon" aria-hidden="true">⚙</span></div><dl class="kv"><dt>Velocidad de voz</dt><dd>${String(c.rate || 1.25).replace('.', ',')}x</dd><dt>Vibración</dt><dd>${c.vib || 'Media'}</dd></dl><a class="btn" href="#ajustes">Editar preferencias</a></section></div>
        <form id="pf" class="card profile-form"><h2>Datos personales</h2><label for="pn">Nombre completo</label><input id="pn" value="${nombre}" autocomplete="name"><label for="pe">Correo electrónico</label><input id="pe" type="email" value="${correo}" autocomplete="email"><p id="pm" role="status"></p><button class="p">Guardar cambios</button></form>
        <p><button class="r" id="lo" type="button">Cerrar sesión de forma segura</button></p>`;
    },
    i() { $('#pf').onsubmit = e => { e.preventDefault(); const name = $('#pn').value.trim(), email = $('#pe').value.trim().toLowerCase(); if (!name || !email.includes('@')) { $('#pm').className = 'err'; $('#pm').textContent = '✖ Completa un nombre y correo válidos.'; return; } updateSession({ name, email }); $('#pm').className = 'ok'; $('#pm').textContent = '✔ Datos actualizados.'; }; $('#lo').onclick = () => { if (!confirm('¿Quieres cerrar sesión?')) return; st.set('role', null); location.href = '../index.html'; }; }
  },
  destino: { // HU-010, HU-016 · vista 18
    h() {
      const session = getSession(), nombre = session.name || 'Rosa Mendoza', historial = st.get('hist', HIST0());
      return `<section class="dashboard-welcome"><p class="eyebrow">BIENVENIDA, ${nombre.toUpperCase()}</p><h1>¿A dónde quieres ir?</h1><p>Elige un destino y te acompañaremos con indicaciones accesibles.</p><div class="quick-stats"><span><strong>${historial.length}</strong><small>trayectos</small></span><span><strong>${st.get('dest', '—')}</strong><small>último destino</small></span><span><strong class="ok">Activo</strong><small>asistencia</small></span></div></section>
      <section class="full"><p>Toca el micrófono y di tu destino.</p>
        <button class="y mic" id="mic" type="button" aria-label="Hablar para buscar destino"><span aria-hidden="true">🎤</span></button>
        <p id="m" role="status"><span class="badge">En reposo</span></p></section>
      <form id="f" class="card" novalidate><label for="q">O escribe tu destino</label><input id="q" list="ds" autocomplete="off">
        <datalist id="ds">${DESTINOS.map(d => `<option value="${d}">`).join('')}</datalist><p id="e" role="alert" class="err"></p><button class="p">Buscar destino</button></form>
      <div id="op"></div><h2>Destinos frecuentes</h2>
      <div class="cols3">${FRECUENTES.map(([d, n]) => `<button class="dest" type="button" data-d="${d}"><strong>${n}</strong><small>Doble toque para ir</small></button>`).join('')}</div>`;
    },
    i() {
      const m = $('#m'); let ult = ['', 0];
      const pick = d => {
        if (st.get('mant')) { m.innerHTML = '<span class="badge warn">! Navegación suspendida por mantenimiento</span>'; sim.say('La navegación accesible en esta sede se encuentra suspendida temporalmente por mantenimiento'); return; }
        st.set('dest', d); sim.say('Destino seleccionado: ' + d); location.hash = 'ruta';
      };
      const wire = () => {
        document.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => {
          const t = Date.now(); if (ult[0] === b.dataset.d && t - ult[1] < 1200) pick(b.dataset.d);
          else { ult = [b.dataset.d, t]; sim.say(b.dataset.d + '. Toca de nuevo para ir.'); } }; });
        document.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => pick(b.dataset.o); });
      };
      const buscar = q => {
        q = q.trim().toLowerCase(); $('#e').textContent = ''; $('#op').innerHTML = '';
        const r = /baño|ss\.?hh/.test(q) ? ['SS.HH. Piso 1'] : DESTINOS.filter(d => q && d.toLowerCase().includes(q));
        if (r.length === 1) { pick(r[0]); return; }
        if (r.length > 1) {
          sim.say(`Hay ${Math.min(r.length, 3)} opciones: ` + r.slice(0, 3).join(', '));
          $('#op').innerHTML = `<section class="card"><h2>Elige una opción</h2><div class="cols3">${r.slice(0, 3).map(d => `<button type="button" data-o="${d}">${d}</button>`).join('')}</div></section>`;
          wire(); return;
        }
        m.innerHTML = '<span class="badge err">✖ No entendí, repite</span>';
        $('#e').textContent = '✖ Destino no encontrado. Áreas disponibles: ' + DESTINOS.join(', ') + '.'; sim.say('Destino no encontrado');
      };
      wire();
      $('#mic').onclick = () => { m.innerHTML = '<span class="badge">Escuchando…</span>'; escuchar(buscar, 'ventanilla 3'); };
      $('#f').onsubmit = e => { e.preventDefault(); buscar($('#q').value); };
    }
  },
  ruta: { // HU-034 · vista 19
    h: () => `<h1>${st.get('dest', 'Ventanilla 3')}</h1><p>Sede Central · Piso 1</p>
      <section class="card" id="rc"><p role="status">Calculando ruta…</p></section>
      <button class="y" id="go" type="button" aria-disabled="true">Iniciar navegación</button> <a class="btn" href="#destino">Elegir otro destino</a>`,
    i() {
      const b = st.get('blocked'), d = b ? 57 : 45, t = b ? 3 : 2;
      setTimeout(() => {
        const rc = $('#rc'); if (!rc) return;
        rc.innerHTML = `<h2>Ruta 100% accesible</h2><p class="ok">✔ Sin escaleras: vía rampa y ascensor</p>
          <div class="cols"><p class="stat">${d} m<br><small>Distancia</small></p><p class="stat">${t} min<br><small>Tiempo</small></p></div>
          ${voz(`La voz lee: ruta de ${d} metros, ${t} minutos, sin escaleras, por rampa y ascensor.`)}`;
        sim.say(`Ruta de ${d} metros, ${t} minutos, sin escaleras, por rampa y ascensor`); $('#go').setAttribute('aria-disabled', 'false');
      }, 700);
      $('#go').onclick = e => { if (e.target.getAttribute('aria-disabled') === 'true') return; st.set('nav', { d, re: !!b }); st.set('tripId', Date.now()); st.set('pausa', false); location.hash = 'nav'; };
    }
  },
  nav: { // HU-011, 012, 013, 019 · vista 20
    h: () => `<section class="full" id="nv"><p>Hacia ${st.get('dest', 'Ventanilla 3')}</p><div class="dir" aria-hidden="true" id="ar">↗</div><p class="big" id="dist">32 m</p>
        <p id="ins" role="status">Gira ligeramente a la derecha</p>
        <div><span class="badge" id="bi">IZQ · suave</span> <span class="badge y" id="bd">DER · fuerte</span></div>
        <p><span class="badge" id="a3">Audio 3D: derecha</span> <span class="badge" id="vb">Vibración: pulso derecho</span></p>
        <button class="y" id="rp" type="button">Repetir última instrucción</button><p><small>Doble toque en cualquier parte, o tecla R</small></p>
        <button class="r" id="sos" type="button">S.O.S. · triple toque o mantén 3 s</button></section>
      <details class="card"><summary>Controles de demostración</summary>
        <button type="button" id="pa">Pausar</button> <button type="button" id="ob">Simular obstáculo</button> <button type="button" id="se">Simular pérdida de señal</button><p id="st" role="status"></p></details>`,
    i() {
      const n = st.get('nav') || { d: 32 }; let last = 'Gira ligeramente a la derecha', clicks = [], pausa = false, hold;
      const dir = (d, t) => {
        last = t; $('#ins').textContent = t; $('#ar').textContent = d === 'der' ? '↗' : '↖';
        $('#bd').className = 'badge' + (d === 'der' ? ' y' : ''); $('#bi').className = 'badge' + (d === 'izq' ? ' y' : '');
        $('#bd').textContent = d === 'der' ? 'DER · fuerte' : 'DER · suave'; $('#bi').textContent = d === 'izq' ? 'IZQ · fuerte' : 'IZQ · suave';
        $('#a3').textContent = 'Audio 3D: ' + (d === 'der' ? 'derecha' : 'izquierda'); $('#vb').textContent = 'Vibración: pulso ' + (d === 'der' ? 'derecho' : 'izquierdo');
        sim.buzz(80, 'pulso ' + (d === 'der' ? 'derecho' : 'izquierdo')); sim.say(t); sim.tone(880, .25, d === 'der' ? 1 : -1);
      };
      const tick = () => {
        if (pausa || st.get('pausa')) return;
        if (st.get('blocked') && !n.re) { clearInterval(run.timer); location.hash = 'obstaculo'; return; }
        n.d = Math.max(0, n.d - 2); st.set('nav', n); $('#dist').textContent = n.d + ' m';
        sim.tone(440 + (32 - Math.min(32, n.d)) * 12, .06, last.includes('izquierda') ? -1 : 1); // más agudo al acercarse al giro
        if (n.d === 10) dir('izq', 'En 10 metros, gire a la izquierda');
        if (n.d === 0) { clearInterval(run.timer); st.set('nav', null); location.hash = 'llegada'; }
      };
      dir('der', last); run.timer = setInterval(tick, 1000);
      $('#rp').onclick = () => sim.say(`${last}. Faltan ${n.d} metros.`);
      $('#nv').ondblclick = () => $('#rp').click();
      $('#nv').ontouchstart = e => { if (e.touches.length === 2) $('#rp').click(); };
      onkeydown = e => { if (e.key.toLowerCase() === 'r') $('#rp').click(); };
      $('#pa').onclick = e => { pausa = !pausa; e.target.textContent = pausa ? 'Reanudar' : 'Pausar'; $('#st').className = ''; $('#st').textContent = pausa ? 'En pausa: navegación detenida.' : ''; sim.say(pausa ? 'Navegación en pausa' : 'Navegación reanudada'); };
      $('#ob').onclick = () => { st.set('blocked', st.get('blocked') || { tramo: 'Pasillo B · B-12 ↔ B-13', causa: 'Obras', t: hhmm() }); };
      $('#se').onclick = () => {
        pausa = true; $('#st').className = 'err'; $('#st').textContent = '✖ Pérdida de señal BLE. Orientando paso a paso con los sensores del celular…'; sim.say('Pérdida de señal. Orientando paso a paso');
        setTimeout(() => { pausa = false; $('#st').className = 'ok'; $('#st').textContent = '✔ Señal recuperada.'; }, 3000);
      };
      const activar = () => {
        clearInterval(run.timer); st.set('sos', { t: hhmm(), e: 'n' }); sim.buzz([300, 100, 300, 100, 300], 'S.O.S. intenso'); sim.tone(900, .4);
        sim.say('Alerta S.O.S. enviada a tu familiar y al personal de la sede');
        $('#nv').innerHTML = '<h1>S.O.S. enviado</h1><p>Tu familiar y el personal de seguridad fueron notificados.</p><button class="p" id="cn" type="button">Cancelar alerta</button>';
        $('#cn').onclick = () => { st.set('sos', null); sim.say('Alerta cancelada'); location.hash = 'destino'; };
      };
      const s = $('#sos');
      s.onpointerdown = () => { hold = setTimeout(activar, 3000); }; s.onpointerup = s.onpointerleave = () => clearTimeout(hold);
      s.onclick = () => {
        const t = Date.now(); clicks = clicks.filter(x => t - x < 1500); clicks.push(t);
        if (clicks.length >= 3) activar(); else sim.say(`Pulsa ${3 - clicks.length} veces más para activar el S.O.S.`);
      };
    }
  },
  obstaculo: { // HU-013, HU-015 · vista 21
    h() {
      const sin = (st.get('blocked') || {}).tramo === 'Rampa principal';
      return `<section class="aviso" role="alert"><h1>Precaución: pasillo en obras</h1><p>${sin ? '✖ No hay rutas accesibles disponibles. Solicita asistencia.' : 'Recalculando ruta alternativa…'}</p></section>
        <p><span class="badge">3 pulsos cortos de vibración</span></p>${voz('Voz: Precaución: pasillo en obras. ' + (sin ? 'No hay rutas accesibles disponibles.' : 'Recalculando ruta alternativa.'))}
        <section class="card"><h2>${sin ? 'Sin ruta alternativa' : 'Recalculando'}</h2><div class="bar" ${sin ? 'hidden' : ''}><i></i></div><p id="rs" role="status"></p></section>
        <button class="y" id="ct" type="button" ${sin ? 'hidden' : 'aria-disabled="true"'}>Continuar con la nueva ruta</button> <button class="r" id="so" type="button">S.O.S.</button>`;
    },
    i() {
      const sin = (st.get('blocked') || {}).tramo === 'Rampa principal';
      sim.buzz([100, 80, 100, 80, 100], '3 pulsos cortos');
      sim.say('Precaución: pasillo en obras. ' + (sin ? 'No hay rutas accesibles disponibles. Solicita asistencia.' : 'Recalculando ruta alternativa.'));
      if (!sin) {
        requestAnimationFrame(() => { $('.bar i').style.width = '100%'; });
        setTimeout(() => {
          const result = $('#rs'), continueButton = $('#ct'); if (!result || !continueButton) return;
          result.className = 'ok'; result.textContent = '✔ Nueva ruta lista: 57 m · sin escaleras'; continueButton.setAttribute('aria-disabled', 'false'); sim.say('Nueva ruta lista, 57 metros, sin escaleras');
        }, 1500);
      }
      $('#ct').onclick = e => { if (e.target.getAttribute('aria-disabled') === 'true') return; st.set('nav', { d: 57, re: true }); location.hash = 'nav'; };
      $('#so').onclick = () => { st.set('sos', { t: hhmm(), e: 'n' }); sim.buzz([300, 100, 300], 'S.O.S.'); sim.say('Alerta S.O.S. enviada'); $('#rs').className = 'err'; $('#rs').textContent = '✖ S.O.S. enviado a tu familiar y a la sede.'; };
    }
  },
  llegada: { // HU-014, HU-046 · vista 22
    h: () => `<section class="full verde"><div class="big" aria-hidden="true">✔</div><h1>Llegaste a ${st.get('dest', 'Ventanilla 3')}</h1>
        <p><span class="badge">Melodía</span> <span class="badge">Vibración 1 s</span> <span class="badge">Aviso enviado a tu familiar</span></p></section>
      <form id="f" class="card" novalidate><fieldset class="est5"><legend>Califica tu trayecto</legend>
        ${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="r" value="${n}"><span aria-hidden="true">★</span><span class="sr">${n} ${n > 1 ? 'estrellas' : 'estrella'}</span></label>`).join('')}</fieldset>
        <button type="button" id="vn">Grabar nota de voz si hubo fallas</button><p id="m" role="status"></p><button class="p">Enviar calificación</button></form>`,
    i() {
      const d = st.get('dest', 'Ventanilla 3'), f = $('#f'), m = $('#m');
      const tripId = st.get('tripId', null) || Date.now(), arrivalKey = `${tripId}|${d}`;
      const now = new Date(), day = now.toISOString().slice(0, 10), time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (st.get('arrivalKey') !== arrivalKey) {
        const H = st.get('hist', HIST0()); H.unshift({ d: day, r: 'Sede Central', m: d, dur: '2 min' }); st.set('hist', H.slice(0, 30));
        st.set('arr', { d, t: time }); st.set('arrivalKey', arrivalKey);
      }
      [523, 659, 784].forEach((hz, k) => sim.tone(hz, .25, 0, k * .3)); sim.buzz(1000, 'continua 1 s'); sim.say(`Llegaste a ${d}. Aviso enviado a tu familiar.`);
      f.onchange = () => document.querySelectorAll('.est5 label').forEach((l, i) => l.classList.toggle('on', i < +f.r.value));
      $('#vn').onclick = e => { e.target.textContent = 'Grabando… (máx. 10 s)'; setTimeout(() => { e.target.textContent = '✔ Nota de voz grabada'; }, 2000); };
      f.onsubmit = e => {
        e.preventDefault();
        if (!f.r.value) { m.className = 'err'; m.textContent = '✖ Elige una calificación del 1 al 5.'; return; }
        if (!navigator.onLine) { m.className = 'err'; m.textContent = '✖ No se pudo enviar. Sin conexión.'; return; }
        m.className = ''; m.textContent = 'Enviando…';
        setTimeout(() => { st.set('rating', +f.r.value); m.className = 'ok'; m.textContent = '✔ Gracias por tu calificación.'; sim.tone(700); }, 600);
      };
    }
  },
  servicios: { // HU-016 · vista 24
    h: () => `<h1>Servicios cercanos</h1><p>Di un comando para desviar tu ruta.</p>
      <button class="y mic2" id="mic" type="button">Di un comando<small>Toca y habla</small></button>
      <form id="f" class="card" novalidate><label for="q">O escribe un comando</label><input id="q" placeholder="Baño, Salida o Ascensor"><button class="p">Enviar comando</button></form>
      <section class="card"><h2>Comandos por voz</h2><ul><li><strong>'Baño'</strong><br>Pausa la ruta y te lleva al SS.HH. más cercano</li>
        <li><strong>'Salida'</strong><br>Te lleva a la salida más cercana del piso</li><li><strong>'Ascensor'</strong><br>Te lleva al ascensor accesible más cercano</li></ul></section>
      <section class="card" id="rs" aria-live="polite"></section>`,
    i() {
      const cmd = t => {
        t = t.toLowerCase(); const k = /baño|ss\.?hh/.test(t) ? 'baño' : /salida/.test(t) ? 'salida' : /ascensor/.test(t) ? 'ascensor' : null;
        if (!k) { $('#rs').innerHTML = '<p class="err">✖ Servicio no encontrado en este piso.</p>'; sim.say('Servicio no encontrado en este piso'); return; }
        const [n, d] = SERV[k]; st.set('pausa', true);
        $('#rs').innerHTML = `<h2>${n} más cercano</h2><p class="stat">${d} m · mismo piso</p><p class="badge warn">! Ruta actual en pausa</p><br>
          <button class="p" id="ir" type="button">Ir al ${n}</button> <button type="button" id="vv">Volver a mi ruta</button>`;
        sim.say(`${n} más cercano a ${d} metros, en el mismo piso. Ruta actual en pausa.`);
        $('#ir').onclick = () => { st.set('ruta0', { n: st.get('nav'), d: st.get('dest') }); st.set('nav', { d, re: true }); st.set('dest', n); st.set('pausa', false); location.hash = 'nav'; };
        $('#vv').onclick = () => { const r = st.get('ruta0'); if (r) { st.set('nav', r.n); st.set('dest', r.d); } st.set('pausa', false); location.hash = 'nav'; };
      };
      $('#mic').onclick = () => escuchar(cmd, 'baño');
      $('#f').onsubmit = e => { e.preventDefault(); cmd($('#q').value); };
    }
  },
  ajustes: { // HU-004, HU-006 · vista 23
    h() {
      const c = { rate: 1.25, vib: 'Media', lang: 'es-PE', ...(st.get('cfg', {}) || {}) };
      return `<h1>Ajustes de accesibilidad</h1><form id="f" novalidate>
        <section class="card"><h2>Velocidad de voz</h2><label for="rt" class="sr">Velocidad de voz</label>
          <input id="rt" type="range" min="0.75" max="2" step="0.25" value="${c.rate}"><p>0,75x · <strong id="rv">${String(c.rate).replace('.', ',')}x</strong> · 2,0x</p></section>
        <fieldset class="card"><legend>Intensidad de vibración</legend>${['Baja', 'Media', 'Alta'].map(v => `<label><input type="radio" name="vb" value="${v}" ${v === c.vib ? 'checked' : ''}> ${v}</label>`).join('')}</fieldset>
        <fieldset class="card"><legend>Sintetizador regional</legend>${[['es-PE', 'Español (Perú)'], ['es-MX', 'Español (México)'], ['es-ES', 'Español (España)']].map(([k, n]) => `<label><input type="radio" name="ln" value="${k}" ${k === c.lang ? 'checked' : ''}> ${n}</label>`).join('')}</fieldset>
        <p id="m" role="status"></p><button type="button" id="pv">Probar voz</button> <button class="p">Guardar ajustes</button> <button type="button" id="r0">Restablecer por defecto</button></form>`;
    },
    i() {
      const f = $('#f'), m = $('#m'), cur = () => ({ rate: +$('#rt').value, vib: f.vb.value, lang: f.ln.value });
      $('#rt').oninput = () => { $('#rv').textContent = $('#rt').value.replace('.', ',') + 'x'; };
      $('#pv').onclick = () => { m.className = ''; m.textContent = 'Probando voz…'; const c = cur(); sim.say('Esta es una prueba de voz', c); sim.buzz(200, c.vib, c.vib); };
      f.onsubmit = e => {
        e.preventDefault();
        try { st.set('cfg', cur()); m.className = 'ok'; m.textContent = '✔ Ajustes guardados.'; sim.say('Ajustes guardados'); }
        catch { m.className = 'err'; m.textContent = '✖ No se pudo guardar.'; }
      };
      $('#r0').onclick = () => { localStorage.removeItem('sa_cfg'); app.route(); };
    }
  }
};
