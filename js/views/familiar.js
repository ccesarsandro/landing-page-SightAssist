import { $, st, HIST0, fmtFecha, getSession, updateSession } from '../core/state.js';
import { sim } from '../core/sim.js';
import { run, app } from '../core/app.js';

/* Módulo C · App del familiar o cuidador (vistas 25 a 32) */
const NODOS = ['B-01', 'B-07', 'B-12', 'B-31', 'B-40'];
const MSG = ['Llegué a la sala', 'Te espero afuera', 'Voy en camino', 'Ya terminé mi trámite', 'Estoy bien, no te preocupes'];
const hm = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const nodoDe = n => (n ? NODOS[Math.min(4, Math.floor((1 - Math.min(n.d, 32) / 32) * 5))] : null);
const esquema = nodo => `<div class="esq" role="img" aria-label="Plano esquemático. Ahora: ${nodo}">${NODOS.map(n => `<span class="${n === nodo ? 'ahora' : ''}">${n === nodo ? '● Ahora: ' : ''}${n}</span>`).join('')}</div>`;
const descargar = (nombre, texto) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain' })); a.download = nombre; a.click(); };
const personas = () => st.get('accounts', []).filter(account => account.role === 'b');
const personaVinculada = () => {
  const link = st.get('link', {}) || {}, list = personas();
  return list.find(account => account.email === link.email) || list[0] || { name: 'Usuario', email: '' };
};

export const familiarViews = {
  perfil: {
    h() {
      const session = getSession(), nombre = session.name || 'Carlos Mendoza', correo = session.email || 'carlos@correo.com', link = st.get('link'), persona = personaVinculada();
      const alertas = st.get('alr', {}) || {};
      return `<h1>Mi perfil</h1><section class="profile-hero"><div class="avatar" aria-hidden="true">${nombre.slice(0, 1).toUpperCase()}</div><div><p class="eyebrow">FAMILIAR Y CUIDADOR</p><h2>${nombre}</h2><p>${correo}</p><span class="badge ok">● Cuenta activa</span></div></section>
        <div class="profile-grid"><section class="card"><div class="section-heading"><div><h2>Estado del acompañamiento</h2><p class="section-subtitle">Información de tu vínculo.</p></div><span class="menu-icon" aria-hidden="true">◉</span></div><dl class="kv"><dt>Cuenta vinculada</dt><dd>${link ? `${persona.name} · Sede Central` : 'Pendiente'}</dd><dt>Permiso</dt><dd>${(link || {}).perm === 'tiempo' ? 'Tiempo real' : 'Llegada segura'}</dd><dt>Alertas</dt><dd class="ok">${alertas.b15 || alertas.b5 ? 'Configuradas' : 'Por configurar'}</dd></dl></section>
        <section class="card"><div class="section-heading"><div><h2>Preferencias</h2><p class="section-subtitle">Cómo recibes las novedades.</p></div><span class="menu-icon" aria-hidden="true">⚙</span></div><p class="badge ok">Vibración + sonido</p><p><small>Las alertas de inactividad, batería y llegada están disponibles.</small></p><a class="btn" href="#alertas">Configurar alertas</a></section></div>
        <form id="pf" class="card profile-form"><h2>Datos personales</h2><label for="pn">Nombre completo</label><input id="pn" value="${nombre}" autocomplete="name"><label for="pe">Correo electrónico</label><input id="pe" type="email" value="${correo}" autocomplete="email"><p id="pm" role="status"></p><button class="p">Guardar cambios</button></form>`;
    },
    i() {
      $('#pf').onsubmit = e => { e.preventDefault(); const name = $('#pn').value.trim(), email = $('#pe').value.trim().toLowerCase(); if (!name || !email.includes('@')) { $('#pm').className = 'err'; $('#pm').textContent = '✖ Completa un nombre y correo válidos.'; return; } updateSession({ name, email }); $('#pm').className = 'ok'; $('#pm').textContent = '✔ Datos actualizados.'; };
    }
  },
  monitoreo: { // HU-018 · vista 26
    h() {
      const session = getSession(), nombre = session.name || 'Carlos Mendoza', link = st.get('link');
      return `<section class="dashboard-welcome"><p class="eyebrow">CENTRO DE ACOMPAÑAMIENTO</p><h1>Hola, ${nombre}</h1><p>Supervisa el recorrido y recibe alertas importantes desde un solo lugar.</p><div class="quick-stats"><span><strong class="${link ? 'ok' : 'warn'}">${link ? 'Vinculada' : 'Pendiente'}</strong><small>cuenta</small></span><span><strong>${st.get('vis', true) ? 'En vivo' : 'Llegada'}</strong><small>permiso</small></span><span><strong class="ok">${st.get('alr') ? 'Activas' : 'Configura'}</strong><small>alertas</small></span></div></section><h2>Monitoreo en vivo</h2><div id="mv"></div>`;
    },
    i() {
      let ant = false;
      const draw = () => {
        const vis = st.get('vis', true), n = st.get('nav'), s = st.get('sos'), link = st.get('link') || {}, persona = personaVinculada(), nodo = nodoDe(n);
        if (!link.perm) {
          $('#mv').innerHTML = `<section class="card"><p><strong>${persona.name}</strong> · Sede Central</p><p class="card warn">! Cuenta no vinculada. Ingresa el código de vinculación para solicitar acceso.</p><a class="btn" href="#vincular">Vincular cuenta</a></section>`;
          return;
        }
        const solo = !vis || link.perm === 'llegada';
        $('#mv').innerHTML = (s ? `<p class="card err">✖ S.O.S. activo de ${persona.name}. <a href="#sos">Ver alerta</a></p>` : '') +
          `<section class="card"><p><strong>${persona.name}</strong> · Sede Central ${solo ? '<span class="badge warn">! Solo aviso de llegada</span>' : n ? '<span class="badge ok">✔ En ruta</span>' : '<span class="badge">Fuera de la sede</span>'}</p></section>` +
          (!vis ? '<p class="card warn">! Monitoreo pausado por el usuario. Solo recibes el aviso de llegada segura.</p>'
            : link.perm === 'llegada' ? '<p class="card warn">! Tu permiso es solo «llegada segura». Puedes cambiarlo en Vincular.</p>'
            : n ? `<section class="card"><h2>Plano esquemático</h2>${esquema(nodo)}<p><span class="badge">Solo dentro de la sede</span></p>
                <dl class="kv"><dt>Destino</dt><dd>${st.get('dest', 'Ventanilla 3')}</dd><dt>Nodo actual</dt><dd>${nodo}</dd><dt>Llegada</dt><dd>en ${Math.max(1, Math.ceil(n.d / 16))} min</dd></dl></section>`
            : '<p class="card">Usuario fuera de la sede: sin recorrido activo.</p>');
        if (s && !ant) sim.tone(880, .3); ant = !!s;
      };
      $('#mv').innerHTML = '<p class="card" role="status">Buscando ubicación…</p>';
      run.timer = setTimeout(() => { draw(); run.timer = setInterval(draw, 1000); }, 600);
    }
  },
  vincular: { // HU-002, HU-023 · vista 25
    h: () => `<h1>Vincular cuenta</h1><form id="f" class="card" novalidate><p>Ingresa el código de 6 dígitos que generó tu familiar en su app.</p>
      <label for="person">Persona a acompañar</label><select id="person">${personas().map(person => `<option value="${person.email}">${person.name} · ${person.email}</option>`).join('') || '<option value="">Usuario demo</option>'}</select>
      <div class="code" role="group" aria-label="Código de 6 dígitos">${[1, 2, 3, 4, 5, 6].map(n => `<input class="dg" inputmode="numeric" maxlength="1" aria-label="Dígito ${n}">`).join('')}</div>
      <p><span class="badge" id="tm">Código válido por 15:00 min</span> · Demo: 482159</p>
      <fieldset><legend>Permisos de privacidad</legend>
        <label><input type="radio" name="pm" value="llegada" checked> <span><strong>Solo llegada segura</strong><br><small>Recibes un aviso al llegar</small></span></label>
        <label><input type="radio" name="pm" value="tiempo"> <span><strong>Seguimiento en tiempo real</strong><br><small>Ves su nodo dentro de la sede</small></span></label></fieldset>
      <p class="warn">! Tu familiar debe aceptar el permiso</p><p id="m" role="alert"></p>
      <button class="p" id="vc" aria-disabled="true">Vincular cuenta</button> <button type="button" id="cc">Cancelar</button>
      ${st.get('link') ? '<button type="button" id="dv">Desvincular cuenta</button>' : ''}</form>`,
    i() {
      const dg = [...document.querySelectorAll('.dg')]; let seg = 900;
      const code = () => dg.map(x => x.value).join('');
      dg.forEach((x, k) => {
        x.oninput = () => { if (x.value && dg[k + 1]) dg[k + 1].focus(); $('#vc').setAttribute('aria-disabled', String(code().length < 6)); };
        x.onkeydown = e => { if (e.key === 'Backspace' && !x.value && dg[k - 1]) dg[k - 1].focus(); };
      });
      run.timer = setInterval(() => { seg = Math.max(0, seg - 1); $('#tm').textContent = seg ? `Código válido por ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')} min` : '✖ Código vencido'; }, 1000);
      $('#f').onsubmit = e => {
        e.preventDefault(); const m = $('#m');
        if (code().length < 6) return;
        if (!seg) { m.className = 'err'; m.textContent = '✖ El código venció. Pide uno nuevo.'; return; }
        if (code() !== '482159') { m.className = 'err'; m.textContent = '✖ Código inválido o vencido.'; sim.say('Código inválido'); return; }
        const pm = $('#f').pm.value; m.className = ''; m.textContent = 'Validando…';
        setTimeout(() => {
          const persona = personas().find(account => account.email === $('#person').value) || personaVinculada();
          m.textContent = `Solicitud enviada. ${persona.name} debe aceptar el permiso…`;
          setTimeout(() => { st.set('link', { perm: pm, email: persona.email }); m.className = 'ok'; m.textContent = `✔ Cuenta vinculada con ${persona.name} (${pm === 'llegada' ? 'solo llegada segura' : 'seguimiento en tiempo real'}).`; sim.tone(880); }, 1200);
        }, 600);
      };
      $('#cc').onclick = () => { location.hash = 'monitoreo'; };
      $('#dv')?.addEventListener('click', () => { localStorage.removeItem('sa_link'); app.route(); });
    }
  },
  push: { // HU-017 · vista 27
    h: () => `<h1>Notificación de llegada segura</h1><section class="full" id="lk"><p id="fh"></p><p class="big" id="rl">--:--</p><div id="nt"></div><p>Toca la notificación para ver el detalle</p></section>
      <div class="card"><button type="button" id="sl">Simular llegada de ${personaVinculada().name}</button> <button type="button" id="of">Simular sin conexión</button>
        <label class="chk"><input type="checkbox" id="mu"> Silenciar notificaciones</label><p id="m" role="status"></p></div>`,
    i() {
      const tick = () => { $('#fh').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }); $('#rl').textContent = hm(); };
      tick(); run.timer = setInterval(tick, 1000);
      const persona = personaVinculada(), card = a => `<article class="notif"><p><small>SightAssist · ahora</small></p><h2>Llegada segura</h2><p>${persona.name} llegó a ${a.d} · Sede Central · ${a.t}</p><p class="badge ok">✔ Sin incidentes en el trayecto</p></article>`;
      const mostrar = a => {
        if ($('#mu').checked) { $('#m').className = 'warn'; $('#m').textContent = '! Notificaciones silenciadas: no se muestra la alerta.'; return; }
        $('#nt').innerHTML = card(a); $('#m').className = 'ok'; $('#m').textContent = '✔ Entregada'; sim.tone(660); sim.buzz(200, 'push recibido'); sim.say(`Llegada segura. ${persona.name} llegó a ${a.d}`);
      };
      const nueva = () => ({ d: st.get('dest', 'Ventanilla 3'), t: hm() });
      if (st.get('arr')) $('#nt').innerHTML = card(st.get('arr'));
      $('#sl').onclick = () => mostrar(nueva());
      $('#of').onclick = () => { $('#m').className = 'err'; $('#m').textContent = '✖ Entrega fallida. Reintentando…'; setTimeout(() => mostrar(nueva()), 2000); };
      $('#nt').onclick = () => { location.hash = 'historial'; };
    }
  },
  sos: { // HU-019 · vista 28
    h() {
      const s = st.get('sos'), persona = personaVinculada();
      return s ? `<section class="full rojo"><div class="big" aria-hidden="true">⚠</div><h1>S.O.S. · EMERGENCIA</h1><p>${persona.name} activó una alerta de emergencia.</p>
          <div class="card" style="color:var(--negro);text-align:left"><h2>Incidente</h2><dl class="kv"><dt>Nodo</dt><dd>B-12 · Pasillo B</dd><dt>Sede</dt><dd>Sede Central · Piso 1</dd><dt>Hora</dt><dd>${s.t}</dd></dl>
            <p><strong>${s.rec ? '✔ Recibido' : '✖ Sin atender'}</strong></p></div>
          <button type="button" id="ls">Llamar a seguridad · Central 24 h</button><button class="y" type="button" id="lr">Llamar a ${persona.name} · Contacto directo</button>
          <button type="button" id="rc">Marcar como recibido</button><p id="m" role="status"></p></section>`
        : `<h1>Alerta crítica S.O.S.</h1><p class="card ok">✔ No hay alertas activas.</p><p class="card">Cuando ${persona.name} active un S.O.S., esta pantalla se abre sola con sonido y vibración.</p>`;
    },
    i() {
      const s = st.get('sos');
      if (s && !s.rec) { sim.buzz([300, 100, 300], 'S.O.S.'); sim.tone(900, .4); sim.say(`Emergencia: ${personaVinculada().name} activó una alerta S.O.S.`); }
      const llamar = quien => { const m = $('#m'); if (!navigator.onLine) { m.textContent = '✖ Llamada no disponible.'; return; } m.textContent = `Llamando a ${quien}… (función simulada)`; sim.say('Llamando a ' + quien); };
      $('#ls')?.addEventListener('click', () => llamar('seguridad')); $('#lr')?.addEventListener('click', () => llamar(personaVinculada().name));
      $('#rc')?.addEventListener('click', () => { s.rec = true; st.set('sos', s); app.route(); });
    }
  },
  historial: { // HU-021 · vista 29
    h: () => `<h1>Historial de trayectos</h1><div role="group" aria-label="Periodo"><button type="button" data-g="p" data-n="7" aria-pressed="true">Semana</button> <button type="button" data-g="p" data-n="30" aria-pressed="false">Mes</button></div>
      <div id="hl"></div><p><button type="button" id="et">Exportar texto</button> <button type="button" id="ep">Exportar PDF</button> <button type="button" id="del">Eliminar historial</button></p><p id="m" role="status"></p>`,
    i() {
      let dias = 7, cur = [];
      const draw = () => {
        cur = st.get('hist', HIST0()).filter(h => (Date.now() - new Date(h.d + 'T12:00:00')) / 864e5 <= dias);
        $('#hl').innerHTML = cur.map(h => `<article class="card"><p><strong>${fmtFecha(h.d)}</strong> <span class="badge ok">✔ Completado</span></p>
          <dl class="kv"><dt>Recinto</dt><dd>${h.r}</dd><dt>Módulo</dt><dd>${h.m}</dd><dt>Duración</dt><dd>${h.dur}</dd></dl></article>`).join('') || '<p class="card">Sin visitas en el periodo.</p>';
      };
      document.querySelectorAll('[data-g="p"]').forEach(b => { b.onclick = () => {
        document.querySelectorAll('[data-g="p"]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); dias = +b.dataset.n; draw(); }; });
      $('#et').onclick = () => { descargar('historial.txt', cur.map(h => `${fmtFecha(h.d)} · ${h.r} · ${h.m} · ${h.dur}`).join('\n') || 'Sin visitas'); $('#m').className = 'ok'; $('#m').textContent = '✔ Historial exportado (texto).'; };
      $('#ep').onclick = () => { $('#m').className = 'ok'; $('#m').textContent = '✔ Exportación a PDF simulada.'; };
      $('#del').onclick = () => { if (!confirm('Se eliminará el historial de trayectos de forma irreversible. ¿Continuar?')) return; st.set('hist', []); draw(); $('#m').className = 'ok'; $('#m').textContent = '✔ Historial eliminado.'; };
      draw();
    }
  },
  alertas: { // HU-020, HU-022 · vista 30
    h() {
      const c = { min: 5, b15: true, b5: true, ...(st.get('alr', {}) || {}) }, persona = personaVinculada();
      return `<h1>Alertas de seguridad</h1><form id="f" novalidate>
        <section class="card alert-setting"><div class="section-heading"><div><h2>Inactividad</h2><p class="section-subtitle">Controla cuándo avisarte si ${persona.name} se detiene.</p></div><span class="badge warn">Configurada</span></div>
          <div class="alert-options" role="group" aria-label="Minutos de inactividad">${[3, 5, 7, 10].map(n => `<button type="button" data-g="min" data-n="${n}" aria-pressed="${n === c.min}">${n} min</button>`).join(' ')}</div>
          <p class="warn" id="av">! Aviso si ${persona.name} se detiene más de ${c.min} min</p><p><small>${persona.name} recibe antes una consulta: «¿Estás bien?».</small></p></section>
        <section class="card alert-setting"><div class="section-heading"><div><h2>Batería del celular de ${persona.name}</h2><p class="section-subtitle">Recibe alertas antes de que se quede sin comunicación.</p></div><span class="badge ok">Activa</span></div>
          <label class="chk"><input type="checkbox" role="switch" id="b15" ${c.b15 ? 'checked' : ''}> Aviso a 15%</label>
          <label class="chk"><input type="checkbox" role="switch" id="b5" ${c.b5 ? 'checked' : ''}> Alerta crítica a 5%</label><p><span class="badge">Vibración + sonido en tu celular</span></p></section>
        <p id="m" role="status"></p><button type="button" id="pv">Probar aviso</button> <button class="p">Guardar alertas</button></form>`;
    },
    i() {
      let min = (st.get('alr', {}) || {}).min || 5;
      document.querySelectorAll('[data-g="min"]').forEach(b => { b.onclick = () => {
        document.querySelectorAll('[data-g="min"]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); min = +b.dataset.n; $('#av').textContent = `! Aviso si ${personaVinculada().name} se detiene más de ${min} min`; }; });
      $('#pv').onclick = () => { sim.tone(660, .3); sim.buzz([200, 100, 200], 'aviso de prueba'); sim.say(`${personaVinculada().name} lleva ${min} minutos detenida en el nodo B-12`); };
      $('#f').onsubmit = e => {
        e.preventDefault();
        try { st.set('alr', { min, b15: $('#b15').checked, b5: $('#b5').checked }); $('#m').className = 'ok'; $('#m').textContent = '✔ Alertas guardadas.'; }
        catch { $('#m').className = 'err'; $('#m').textContent = '✖ No se pudo guardar.'; }
      };
    }
  },
  privacidad: { // HU-023 · vista 31
    h() {
      const v = st.get('vis', true);
      return `<h1>Mi privacidad</h1><p><span class="badge">Pantalla del usuario principal</span></p><section class="card privacy-card"><div class="section-heading"><div><h2>Ubicación ${v ? 'visible' : 'oculta'}</h2><p class="section-subtitle">Controla el nivel de seguimiento que compartes.</p></div><span class="badge ${v ? 'ok' : 'warn'}">${v ? 'Compartida' : 'Pausada'}</span></div>
        <button class="privacy-switch" id="sw" role="switch" aria-checked="${v}" type="button">${v ? 'Visible para mi familiar' : 'Oculta'}</button>
        <p>${v ? 'Carlos ve en qué nodo estás dentro de la sede.' : 'Carlos solo recibe el aviso de llegada segura.'}</p>
        <p class="badge">${v ? '✔ Visible para: Carlos (hijo)' : '! Estado alternativo'}</p><p><small>El cambio se aplica al instante.</small></p></section>`;
    },
    i() {
      $('#sw').onclick = () => { const v = !st.get('vis', true); st.set('vis', v); sim.say(v ? 'Ubicación visible' : 'Monitoreo pausado por el usuario'); app.route(); $('#sw').focus(); };
    }
  },
  mensajes: { // HU-024 · vista 32
    h: () => `<h1>Mensajes rápidos</h1><p id="ok" role="status" class="ok"></p>
      <div class="msgs">${MSG.map(t => `<button type="button" class="msg" data-t="${t}"><strong>${t}</strong><small>Toca para enviar</small></button>`).join('')}</div>
      <p class="card"><span aria-hidden="true">🔊</span> Se reproduce en voz alta en el celular del receptor</p>
      <button type="button" id="nv">Enviar nota de voz (máx. 10 s)</button><p id="er" role="alert" class="err"></p>`,
    i() {
      const enviar = (txt, voz) => {
        $('#er').textContent = '';
        if (!navigator.onLine) { $('#er').textContent = '✖ Sin conexión: no se pudo enviar.'; return; }
        $('#ok').textContent = 'Enviando…';
        setTimeout(() => { $('#ok').textContent = '✔ Enviado: ' + txt; sim.tone(660); if (voz) sim.say(txt); }, 500);
      };
      document.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => enviar(b.dataset.t, true); });
      $('#nv').onclick = () => enviar('Nota de voz (10 s)', false);
    }
  }
};
