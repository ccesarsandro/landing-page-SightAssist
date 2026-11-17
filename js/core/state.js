'use strict';
/* Estado compartido entre módulos (localStorage) y utilidades */
export const $ = (s, r = document) => r.querySelector(s);
export const hhmm = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/* Estado compartido entre módulos (localStorage) */
export const st = {
  get(k, d) { try { const v = localStorage.getItem('sa_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sa_' + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
};
export const getSession = () => st.get('session', {}) || {};
export const updateSession = patch => {
  const current = getSession(), next = { ...current, ...patch };
  st.set('session', next);
  const accounts = st.get('accounts', []);
  if (current.email && accounts.length) {
    const updated = accounts.map(account => account.email === current.email ? { ...account, name: next.name, email: next.email } : account);
    st.set('accounts', updated);
  }
  return next;
};
export const log = (a, u, ip = '190.236.14.22') => { const L = st.get('log', []); L.unshift({ d: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), t: hhmm(), u, a, ip }); st.set('log', L.slice(0, 20)); };

/* Historial de trayectos de ejemplo (fechas relativas a hoy) y formato de fecha */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fmtFecha = iso => { const [y, m, d] = iso.split('-'); return `${d} ${MESES[+m - 1]} ${y}`; };
export const HIST0 = () => [[1, 'Ventanilla 3', 2], [3, 'Consultorio 2', 4], [8, 'SS.HH. Piso 1', 1], [15, 'Ventanilla 1', 3]]
  .map(([dd, m, dur]) => ({ d: new Date(Date.now() - dd * 864e5).toISOString().slice(0, 10), r: 'Sede Central', m, dur: dur + ' min' }));
