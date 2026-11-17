import { $, st, log, getSession, updateSession } from '../core/state.js';
import { sim } from '../core/sim.js';
import { run, app } from '../core/app.js';

/* Módulo A · Panel B2B (vistas 3 a 16 del prototipo) */
const ICON = { ok: '✔', warn: '!', err: '✖' };
const NODOS = [['B-01', 'ok'], ['B-07', 'warn'], ['B-12', 'ok'], ['B-31', 'err'], ['B-40', 'ok']];
const EST = [['B-12', 'Operativa', 'ok', 'Batería 78% · 62 dBm'], ['B-07', 'Batería baja', 'warn', 'Batería 12% · 81 dBm'], ['B-31', 'Sin señal', 'err', 'Sin respuesta del nodo']];
const BASE = [
  { d: '12/11/2026', t: '14:07', u: 'Sistema', ip: '—', a: 'S.O.S. recibido en B-12' },
  { d: '12/11/2026', t: '14:08', u: 'J. Pérez', ip: '190.236.14.22', a: 'Asignó Seguridad' },
  { d: '12/11/2026', t: '13:40', u: 'M. Quispe', ip: '190.236.9.41', a: 'Bloqueó tramo B-12 a B-13' },
  { d: '12/11/2026', t: '09:15', u: 'Admin', ip: '190.236.14.22', a: 'Alta de baliza B-40' }];
const USERS0 = [['Ana Torres', 'a.torres@sedecentral.pe', 'Administrador', 'Activo'], ['Luis Rojas', 'l.rojas@sedecentral.pe', 'Operador', 'Activo'],
  ['M. Quispe', 'm.quispe@sedecentral.pe', 'Técnico', 'Activo'], ['Carla Díaz', 'c.diaz@sedecentral.pe', 'Operador', 'Suspendido'], ['J. Pérez', 'j.perez@sedecentral.pe', 'Operador', 'Activo']];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const barra = t => `<div class="bar-top"><h1>${t}</h1><p>Sesión · ${(getSession().name || 'Administrador demo')}</p></div>`;
const grupo = (n, etq, sel = 0) => `<div role="group" aria-label="${etq}">${n.map((x, i) => `<button type="button" data-g="${etq}" aria-pressed="${i === sel}">${x}</button>`).join(' ')}</div>`;
const marcar = b => document.querySelectorAll(`[data-g="${b.dataset.g}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
const plano = ({ bloqueado = false, calor = false } = {}) => `<figure class="plano"><figcaption>Sede Central · Piso 1</figcaption>
  <div class="salas"><span>Ventanillas</span><span>Consultorios</span><span>Archivo</span><span>SS.HH.</span><span>Ascensor</span></div>
  <ul class="nodos">${NODOS.map(([n, e]) => `<li class="${e}${bloqueado && n === 'B-12' ? ' blq' : ''}">${ICON[e]} ${n}</li>`).join('')}</ul>
  ${bloqueado ? '<p class="err">✖ Bloqueado · Pasillo B (B-12 ↔ B-13)</p>' : ''}${calor ? '<div class="calor" aria-hidden="true"></div>' : ''}</figure>`;

export const adminViews = {
  perfil: {
    h() {
      const session = getSession(), nombre = session.name || 'Administrador demo', correo = session.email || 'admin@sedecentral.pe';
      const bloqueos = st.get('blocked') ? '1 tramo' : 'Ninguno';
      return `<h1>Mi perfil</h1><section class="profile-hero"><div class="avatar" aria-hidden="true">${nombre.slice(0, 1).toUpperCase()}</div><div><p class="eyebrow">ADMINISTRACIÓN B2B</p><h2>${nombre}</h2><p>${correo}</p><span class="badge ok">● Cuenta activa</span></div></section>
        <div class="profile-grid"><section class="card"><div class="section-heading"><div><h2>Estado de la sede</h2><p class="section-subtitle">Resumen operativo de Sede Central.</p></div><span class="menu-icon" aria-hidden="true">◉</span></div><dl class="kv"><dt>Nodos conectados</dt><dd>49/50</dd><dt>Rutas bloqueadas</dt><dd>${bloqueos}</dd><dt>Alertas activas</dt><dd class="ok">${st.get('sos') ? '1' : '0'}</dd></dl></section>
        <section class="card"><div class="section-heading"><div><h2>Permisos</h2><p class="section-subtitle">Nivel de acceso actual.</p></div><span class="menu-icon" aria-hidden="true">♙</span></div><p class="badge ok">Administrador de infraestructura</p><p><small>Puede gestionar rutas, accesos, alertas y configuración.</small></p></section></div>
        <form id="pf" class="card profile-form"><h2>Datos de cuenta</h2><label for="pn">Nombre completo</label><input id="pn" value="${nombre}" autocomplete="name"><label for="pe">Correo corporativo</label><input id="pe" type="email" value="${correo}" autocomplete="email"><p id="pm" role="status"></p><button class="p">Guardar cambios</button></form>`;
    },
    i() {
      $('#pf').onsubmit = e => { e.preventDefault(); const name = $('#pn').value.trim(), email = $('#pe').value.trim().toLowerCase(); if (!name || !email.includes('@')) { $('#pm').className = 'err'; $('#pm').textContent = '✖ Completa un nombre y correo válidos.'; return; } updateSession({ name, email }); $('#pm').className = 'ok'; $('#pm').textContent = '✔ Datos actualizados.'; };
    }
  },
  centro: { // HU-025, HU-032 · vistas 3-4
    h() {
      const b = st.get('blocked');
      const M = [['◉', 'Nodos conectados', '49/50', '✖ 1 sin señal', 'err'], ['↗', 'Rutas accesibles', b ? '37/40' : '38/40', `! ${b ? 3 : 2} en obras`, 'warn'],
        ['♙', 'Usuarios en el centro', '<span id="us">126</span>', '✔ En vivo', 'ok'], ['◷', 'Respuesta media', '1m 24s', '✔ Objetivo OK', 'ok']];
      return `${barra('Centro de operaciones')}
        <div class="cols4">${M.map(c => `<section class="card metric-card"><div class="metric-heading"><span aria-hidden="true">${c[0]}</span><h2>${c[1]}</h2></div><p class="stat">${c[2]}</p><p class="${c[4]}">${c[3]}</p></section>`).join('')}</div>
        <div class="cols"><section class="card"><div class="section-heading"><div><h2>Plano del edificio · Sede Central</h2><p class="section-subtitle">Estado de rutas y balizas en tiempo real</p></div><span class="badge ok">● En vivo</span></div>${grupo(['Piso 1', 'Piso 2', 'Piso 3'], 'Piso')}
          <div id="pl">${plano({ bloqueado: !!b })}</div><div class="map-legend" aria-label="Leyenda del plano"><span><i class="legend-dot ok"></i>Operativa</span><span><i class="legend-dot warn"></i>Atención</span><span><i class="legend-dot err"></i>Sin señal</span></div></section>
          <section class="card"><h2>Estado de balizas</h2><ul class="est">${EST.map(n => `<li class="${n[2]}"><strong>${ICON[n[2]]} ${n[0]} · ${n[1]}</strong><br>${n[3]}</li>`).join('')}</ul></section></div>`;
    },
    i() {
      let n = 126; run.timer = setInterval(() => { n = Math.max(100, n + Math.round(Math.random() * 4 - 2)); const u = $('#us'); if (u) u.textContent = n; }, 3000);
      document.querySelectorAll('[data-g="Piso"]').forEach((b, i) => { b.onclick = () => { marcar(b);
        $('#pl').innerHTML = i === 2 ? '<p class="warn" role="status">! Plano en proceso de digitalización. Súbelo en el Editor de planos (CAD/SVG).</p>' : plano({ bloqueado: !!st.get('blocked') }); }; });
    }
  },
  editor: { // HU-028, HU-042 · vistas 5-6
    h: () => `${barra('Editor de planos y alta de balizas')}<div class="cols">
      <section class="card"><h2>Lienzo · Piso 1</h2>${grupo(['Mover', 'Medir', 'Baliza'], 'Herramienta', 2)}${plano()}</section>
      <div><section class="card"><h2>Importar plano y calibrar escala</h2>
          <label for="fi">Arrastra un archivo CAD/SVG (máx. 25 MB)</label><input id="fi" type="file" accept=".svg,.json,.dwg"><p id="mf" role="status"></p>
          <label for="dr">Distancia real A ↔ B (m)</label><input id="dr" type="number" step="0.1" value="24.5"><p id="esc" class="ok" role="status">Escala: 1 px = 2,8 cm</p></section>
        <form id="fb" class="card" novalidate><h2>Alta de baliza BLE</h2>
          <label for="mac">Dirección MAC</label><input id="mac" value="A4:C1:38:9F:12:7B">
          <label for="uu">UUID</label><input id="uu" value="f7826da6-4fa2-4e0b-bc5b-71e0893e">
          <label for="px">X (m)</label><input id="px" type="number" value="412"><label for="py">Y (m)</label><input id="py" type="number" value="238">
          <p id="mb" role="alert"></p><button class="p">Registrar</button> <button type="reset">Cancelar</button></form></div></div>`,
    i() {
      document.querySelectorAll('[data-g="Herramienta"]').forEach(b => { b.onclick = () => marcar(b); });
      $('#fi').onchange = e => {
        const f = e.target.files[0], m = $('#mf'); if (!f) return;
        const ok = /\.(svg|json|dwg)$/i.test(f.name), grande = f.size > 25e6;
        m.className = ok && !grande ? 'ok' : 'err';
        m.textContent = !ok ? '✖ Formato no soportado: usa .svg, .json o .dwg.' : grande ? '✖ El archivo supera los 25 MB.' : `✔ ${f.name} cargado`;
      };
      $('#dr').oninput = e => { const d = parseFloat(e.target.value); $('#esc').textContent = d > 0 ? `Escala: 1 px = ${(d * 100 / 875).toFixed(1).replace('.', ',')} cm` : '✖ Ingresa una distancia mayor a 0.'; };
      $('#fb').onsubmit = e => {
        e.preventDefault(); const mac = $('#mac').value.trim().toUpperCase(), m = $('#mb'), L = st.get('macs', []);
        if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) { m.className = 'err'; m.textContent = '✖ MAC inválida. Formato: AA:BB:CC:DD:EE:FF.'; return; }
        if (L.includes(mac)) { m.className = 'err'; m.textContent = '✖ La dirección MAC ya está asignada a otra ubicación.'; return; }
        st.set('macs', [...L, mac]); log('Alta de baliza ' + mac, 'J. Pérez'); m.className = 'ok'; m.textContent = '✔ Baliza registrada en la red activa.'; sim.tone(660);
      };
    }
  },
  bloqueo: { // HU-026, HU-027, HU-029 · vistas 7-8
    h: () => `${barra('Bloqueo de rutas y mantenimiento')}<div class="cols">
      <section class="card"><h2>Plano · Pasillo B · tramo seleccionado</h2><div id="pl">${plano({ bloqueado: !!st.get('blocked') })}</div></section>
      <form id="f" class="card" novalidate><h2>Bloquear tramo</h2>
        <label for="tr">Tramo</label><select id="tr"><option>Pasillo B · B-12 ↔ B-13</option><option>Rampa principal</option></select>
        <fieldset><legend>Causa del bloqueo</legend>${['Limpieza', 'Mantenimiento', 'Obras'].map(c => `<label><input type="radio" name="ca" value="${c}"> ${c}</label>`).join('')}</fieldset>
        <label for="d1">Desde</label><input id="d1" type="time" value="14:00"><label for="d2">Hasta</label><input id="d2" type="time" value="16:30">
        <label class="chk"><input type="checkbox" checked> Notificar a usuarios en tránsito</label>
        <p id="m" role="status"></p><div class="bar" hidden><i></i></div>
        <button class="r">Confirmar bloqueo</button> <button type="button" id="un">Liberar tramo</button></form></div>`,
    i() {
      const f = $('#f'), m = $('#m');
      f.onsubmit = e => {
        e.preventDefault();
        if (!f.ca.value) { m.className = 'err'; m.textContent = '✖ El motivo del cierre es obligatorio.'; sim.say('Selecciona el motivo del cierre'); return; }
        $('.bar').hidden = false; m.className = ''; m.textContent = 'Sincronizando matriz de conectividad… (< 3 s)';
        requestAnimationFrame(() => { $('.bar i').style.width = '100%'; });
        setTimeout(() => {
          st.set('blocked', { tramo: $('#tr').value, causa: f.ca.value, t: $('#d1').value }); log(`Bloqueó ${$('#tr').value} (${f.ca.value})`, 'J. Pérez');
          $('#pl').innerHTML = plano({ bloqueado: true }); m.className = 'ok'; m.textContent = '✔ Tramo bloqueado. 6 usuarios en tránsito con ruta recalculada.'; sim.tone(660);
        }, 1500);
      };
      $('#un').onclick = () => { st.set('blocked', null); $('#pl').innerHTML = plano(); m.className = ''; m.textContent = 'Tramo liberado.'; };
    }
  },
  alertas: { // HU-032, HU-044 · vistas 9-10
    h() {
      const s = st.get('sos'), est = { n: '✖ Sin atender', a: '! Asignado', p: '↻ En proceso', d: '✔ Atendido' };
      return `${barra('Alertas S.O.S. y auditoría')}` + (s
        ? `<p class="sosbar" role="alert">S.O.S. ACTIVO · Visitante en nodo B-12 · Alarma sonora activa</p>
          <section class="card"><h2>Incidente en curso</h2><p>Usuario: Rosa M. · baja visión<br>Sede Central · Piso 1 · Nodo B-12 · Pasillo B<br>Hora: ${s.t}</p>
            <p><strong>${est[s.e]}</strong></p><button class="p" id="as" ${s.e !== 'n' ? 'aria-disabled="true"' : ''}>Asignar Seguridad</button>
            <button type="button" id="pr" ${s.e !== 'a' ? 'aria-disabled="true"' : ''}>Poner en proceso</button>
            <button class="y" id="at" ${s.e === 'd' ? 'aria-disabled="true"' : ''}>Marcar como atendido</button></section>`
        : '<p class="card ok">✔ Sin alertas activas.</p>') +
        `<section class="card"><h2>Bitácora de auditoría</h2><div class="cols"><div><label for="ff">Fecha</label><input id="ff" type="date"></div>
          <div><label for="fp">IP</label><input id="fp" placeholder="190.236.14.22"></div></div>
          <button type="button" id="csv">Exportar CSV</button> <button type="button" id="pdf">Exportar PDF</button><p id="ex" role="status"></p>
          <ul id="lg"></ul><p><small>Registro inmutable: no se puede editar ni borrar.</small></p></section>`;
    },
    i() {
      const s = st.get('sos'); let cur = [];
      if (s && s.e === 'n') { sim.tone(880, .3); sim.tone(660, .3, 0, .4); sim.say('Emergencia en nodo B-12'); }
      const set = (e, a) => { const x = st.get('sos'); x.e = e; st.set('sos', x); log(a, 'J. Pérez'); app.route(); };
      $('#as')?.addEventListener('click', () => { if (st.get('sos').e === 'n') set('a', 'Asignó Seguridad'); });
      $('#pr')?.addEventListener('click', () => { if (st.get('sos').e === 'a') set('p', 'Puso el S.O.S. en proceso'); });
      $('#at')?.addEventListener('click', () => { if (st.get('sos').e !== 'd') set('d', 'Marcó el S.O.S. como atendido'); });
      const draw = () => {
        const f = $('#ff').value.split('-').reverse().join('/'), ip = $('#fp').value.trim();
        cur = [...st.get('log', []), ...BASE].filter(x => (!$('#ff').value || x.d === f) && (!ip || x.ip.includes(ip)));
        $('#lg').innerHTML = cur.map(x => `<li>${x.d} ${x.t} · ${x.u} · ${x.ip} · ${x.a}</li>`).join('') || '<li>Sin registros para el filtro.</li>';
      };
      $('#ff').onchange = draw; $('#fp').oninput = draw; draw();
      $('#csv').onclick = () => {
        const rows = ['Fecha,Hora,Usuario,IP,Acción', ...cur.map(x => [x.d, x.t, x.u, x.ip, x.a].map(c => `"${c}"`).join(','))];
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'bitacora.csv'; a.click();
        $('#ex').className = 'ok'; $('#ex').textContent = '✔ Bitácora exportada (CSV).';
      };
      $('#pdf').onclick = () => { $('#ex').className = 'ok'; $('#ex').textContent = '✔ Exportación a PDF simulada.'; };
    }
  },
  analiticas: { // HU-030, HU-031 · vistas 11-12
    h: () => `${barra('Analíticas, mapas de calor y reportes')}<div class="cols">
      <section class="card"><h2>Mapa de calor · Piso 1 · hora pico 12:00 a 13:00</h2>${grupo(['Hoy', 'Semana', 'Mes'], 'Periodo')}${plano({ calor: true })}
        <p><span class="badge" style="color:#1E64C8">Baja (azul)</span> <span class="badge warn">Media (naranja)</span> <span class="badge err">Alta congestión (rojo)</span></p></section>
      <section class="card"><h2>Informe ejecutivo · Ley N.° 29973</h2><p class="stat">99,2%</p><p>Accesibilidad operativa</p><p class="ok">✔ Cumple la norma</p>
        <dl class="kv"><dt>Rutas sin escaleras</dt><dd>100%</dd><dt>Incidentes S.O.S.</dt><dd>2 (atendidos)</dd><dt>Respuesta media</dt><dd>1m 24s</dd><dt>Periodo</dt><dd>Octubre 2026</dd></dl>
        <p id="mi" role="status"></p><button class="p" id="dl">Descargar informe PDF</button></section></div>`,
    i() {
      const op = [1, .75, .5];
      document.querySelectorAll('[data-g="Periodo"]').forEach((b, i) => { b.onclick = () => { marcar(b); $('.calor').style.opacity = op[i]; }; });
      $('#dl').onclick = e => {
        const b = e.target, m = $('#mi'); if (b.getAttribute('aria-disabled') === 'true') return;
        b.setAttribute('aria-disabled', 'true'); m.className = ''; m.textContent = 'Generando informe…';
        setTimeout(() => { b.setAttribute('aria-disabled', 'false'); m.className = 'ok'; m.textContent = '✔ Informe generado (simulado).'; sim.tone(700); }, 1200);
      };
    }
  },
  roles: { // HU-041 · vistas 13-14
    h: () => `${barra('Configuración global y roles B2B')}
      <form id="fv" class="card" novalidate><h2>Invitar personal por correo</h2>
        <label for="cv">Correo corporativo</label><input id="cv" type="email" placeholder="nuevo.operador@sedecentral.pe">
        <label for="rl">Rol</label><select id="rl"><option>Operador</option><option>Técnico</option><option>Administrador</option></select>
        <p id="mr" role="alert"></p><button class="p">Enviar invitación</button></form>
      <section class="card"><h2>Usuarios</h2><div id="tb"></div></section>`,
    i() {
      let U = st.get('users', USERS0); const msg = (c, t) => { $('#mr').className = c; $('#mr').textContent = t; };
      const E = { Activo: ['ok', '✔'], Pendiente: ['warn', '!'], Suspendido: ['err', '✖'] };
      const draw = () => {
        st.set('users', U);
        const accounts = st.get('accounts', []).map(a => [a.name, a.email, a.role === 'a' ? 'Administrador demo' : a.role === 'b' ? 'Usuario' : 'Familiar', 'Activo', true]);
        const rows = [...U, ...accounts];
        $('#tb').innerHTML = `<div class="scroll"><table><caption class="sr">Usuarios del panel B2B</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>${rows.map((u, i) =>
          `<tr><td>${u[0]}</td><td>${u[1]}</td><td>${u[2]}</td><td class="${E[u[3]][0]}">${E[u[3]][1]} ${u[3]}</td><td>${u[4] ? '<span class="badge">Cuenta registrada</span>' : `<button type="button" data-e="${i}">Editar</button> <button type="button" data-s="${i}">${u[3] === 'Suspendido' ? 'Reactivar' : 'Suspender'}</button>`}</td></tr>`).join('')}</tbody></table></div>`;
      };
      draw();
      $('#tb').onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.e) { msg('err', '✖ Acceso denegado: cambiar roles requiere permisos de SuperAdmin.'); return; }
        const u = U[+b.dataset.s]; u[3] = u[3] === 'Suspendido' ? 'Activo' : 'Suspendido'; log(`${u[3] === 'Suspendido' ? 'Suspendió' : 'Reactivó'} a ${u[0]}`, 'J. Pérez'); draw();
      };
      $('#fv').onsubmit = e => {
        e.preventDefault(); const c = $('#cv').value.trim().toLowerCase();
        if (!EMAIL.test(c)) { msg('err', '✖ Ingresa un correo válido.'); return; }
        if (U.some(u => u[1] === c)) { msg('err', '✖ Ese correo ya está registrado.'); return; }
        U.push([c.split('@')[0], c, $('#rl').value, 'Pendiente']); log('Invitó a ' + c, 'J. Pérez'); draw(); msg('ok', '✔ Invitación enviada a ' + c); $('#cv').value = '';
      };
    }
  },
  sede: { // HU-048, HU-038 · vistas 15-16
    h() {
      const on = st.get('mant', false), S = [['B-07', 12, 'warn', '! Batería baja'], ['B-19', 14, 'warn', '! Batería baja'], ['B-12', 78, 'ok', '✔ OK'], ['B-40', 91, 'ok', '✔ OK'], ['B-31', 0, 'err', '✖ Sin señal']];
      return `${barra('Mantenimiento de sede y estado del sistema')}<div class="cols">
        <section class="card"><h2>Modo mantenimiento · Sede Central</h2>
          <button id="sw" role="switch" aria-checked="${on}" type="button">${on ? 'Servicio suspendido' : 'Servicio activo'}</button>
          <p class="warn" ${on ? '' : 'hidden'}>! Los usuarios verán «Sede en mantenimiento» y no podrán iniciar rutas.</p>
          <label for="rea">Reactivación automática</label><input id="rea" type="datetime-local" value="2026-11-14T08:00">
          <label for="mo">Motivo</label><input id="mo" value="Remodelación Piso 2"><p id="ms" role="status"></p><button class="p" id="gp">Guardar programación</button></section>
        <section class="card"><h2>Salud de balizas</h2><p class="warn">! 2 balizas con batería menor a 15%</p>
          <ul class="salud">${S.map(b => `<li><span>${b[0]}</span><span class="bar"><i style="width:${b[1]}%"></i></span><span class="${b[2]}">${b[3]} · ${b[1]}%</span></li>`).join('')}</ul></section></div>`;
    },
    i() {
      $('#sw').onclick = () => { const on = !st.get('mant', false); st.set('mant', on); log(on ? 'Activó el modo mantenimiento' : 'Desactivó el modo mantenimiento', 'J. Pérez'); sim.say(on ? 'Servicio suspendido' : 'Servicio activo'); app.route(); $('#sw').focus(); };
      $('#gp').onclick = () => {
        const m = $('#ms'), v = $('#rea').value;
        if (!v || !$('#mo').value.trim()) { m.className = 'err'; m.textContent = '✖ Completa la fecha de reactivación y el motivo.'; return; }
        m.className = 'ok'; m.textContent = `✔ Reactivación programada para ${v.replace('T', ' ')}.`; log('Programó la reactivación de la sede', 'J. Pérez');
      };
    }
  }
};
