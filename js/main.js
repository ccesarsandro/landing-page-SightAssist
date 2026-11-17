import { $, st } from './core/state.js';
import { sim } from './core/sim.js';
import { run, app } from './core/app.js';

/* Cada segmento tiene su propia página (data-modulo): login, a, b o c */
const PAGES = { a: 'pages/admin.html', b: 'pages/usuario.html', c: 'pages/familiar.html' };
const CFG = {
  login: { vistas: () => import('./views/auth.js').then(m => m.authViews) },
  a: { nombre: 'Administrador B2B', vistas: () => import('./views/admin.js').then(m => m.adminViews),
       mobile: ['centro', 'alertas', 'bloqueo', 'analiticas'],
       menu: [['centro', 'Centro de operaciones'], ['editor', 'Editor de planos'], ['bloqueo', 'Bloqueo de rutas'], ['alertas', 'Alertas S.O.S.'], ['analiticas', 'Analíticas'], ['roles', 'Roles y accesos'], ['sede', 'Sede y sistema'], ['perfil', 'Mi perfil']] },
  b: { nombre: 'Usuario con discapacidad visual', vistas: () => import('./views/usuario.js').then(m => m.usuarioViews),
       mobile: ['destino', 'nav', 'servicios', 'perfil'],
       menu: [['destino', 'Destino'], ['ruta', 'Ruta'], ['nav', 'Navegación'], ['obstaculo', 'Obstáculo'], ['llegada', 'Llegada'], ['servicios', 'Servicios cercanos'], ['ajustes', 'Ajustes'], ['perfil', 'Perfil']] },
  c: { nombre: 'Familiar o cuidador', vistas: () => import('./views/familiar.js').then(m => m.familiarViews),
       mobile: ['monitoreo', 'sos', 'push', 'mensajes'],
       menu: [['monitoreo', 'Monitoreo'], ['vincular', 'Vincular'], ['push', 'Notificación'], ['sos', 'Alerta S.O.S.'], ['historial', 'Historial'], ['alertas', 'Alertas'], ['privacidad', 'Privacidad'], ['mensajes', 'Mensajes'], ['perfil', 'Mi perfil']] }
};

const M = document.body.dataset.modulo, role = st.get('role');
const cfg = CFG[M];
const ICON = {
  centro: '◉', editor: '▦', bloqueo: '!', alertas: '⚠', analiticas: '▥', roles: '♙', sede: '⚙',
  destino: '⌖', ruta: '↗', nav: '➜', obstaculo: '!', llegada: '✓', servicios: '⌕', ajustes: '⚙', perfil: '◯',
  monitoreo: '◉', vincular: '↔', push: '▣', sos: '⚠', historial: '▤', privacidad: '◌', mensajes: '✉'
};

async function start() {
  const V = await cfg.vistas();
  function route() {
    clearInterval(run.timer); onkeydown = null;
    let key = location.hash.slice(1);
    if (!V[key]) key = cfg.menu ? cfg.menu[0][0] : 'login';
    if (cfg.menu) {
      $('#menu').innerHTML = '<p class="menu-brand"><span aria-hidden="true">◉</span> SightAssist</p>' +
        `<p class="role">${cfg.nombre}</p>` +
        cfg.menu.map(([id, n]) => `<a class="${cfg.mobile.includes(id) ? 'mobile-primary' : ''}" href="#${id}" ${id === key ? 'aria-current="page"' : ''}><span class="menu-icon" aria-hidden="true">${ICON[id] || '•'}</span><span>${n}</span></a>`).join('') +
        '<button class="mobile-more" type="button" aria-expanded="false" aria-controls="menu"><span aria-hidden="true">☰</span><span>Más</span></button>';
      const more = $('.mobile-more');
      more.onclick = () => {
        const open = $('#menu').classList.toggle('menu-open');
        more.setAttribute('aria-expanded', String(open));
        if (open) $('#menu a:not(.mobile-primary):not([aria-current="page"])')?.focus();
      };
    }
    $('#main').innerHTML = `<div class="panel">${V[key].h()}</div>`;
    V[key].i?.();
    document.title = `${cfg.menu ? cfg.menu.find(x => x[0] === key)[1] : 'Acceso'} · SightAssist`;
  }
  app.route = route;
  addEventListener('hashchange', () => { route(); $('#main').focus(); });
  route();
  if (M === 'c') setInterval(() => { // la alerta S.O.S. salta sola en la app del familiar
    const s = st.get('sos'); if (s && !s.rec && location.hash !== '#sos') location.hash = 'sos';
  }, 1500);
}

/* Control de acceso: el acceso solo abre si no hay sesión; cada módulo solo lo abre su perfil */
if (M === 'login' && role) location.replace(PAGES[role]);
else if (M !== 'login' && role !== M) location.replace('../index.html');
else start();

$('#out')?.addEventListener('click', () => { // HU-008: confirmación antes de cerrar sesión
  if (!confirm('¿Quieres cerrar sesión?')) return;
  st.set('role', null); location.href = '../index.html';
});
$('#snd').onclick = e => {
  sim.on = !sim.on; e.target.setAttribute('aria-pressed', String(sim.on));
  e.target.textContent = sim.on ? 'Sonido activado' : 'Activar sonido';
  if (sim.on) { sim.say('Sonido activado'); sim.tone(660); }
};
