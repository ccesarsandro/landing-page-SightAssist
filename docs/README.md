# SightAssist · Demo de Landing Page responsive

Sistema integrado de orientación y navegación inclusiva en interiores para personas con discapacidad visual.
Curso **1ASI0784 · HCI for UX Design** (UPC, NRC 15408), profesor Alan Tito Gutiérrez Gutiérrez.

## Segmentos y accesos
La pantalla de acceso tiene tres perfiles. Cada uno entra a su propio módulo y no puede abrir los de los otros.

| Segmento | Correo de prueba | Pasos extra |
|---|---|---|
| Persona con discapacidad visual | rosa.mendoza@correo.com | Ninguno |
| Familiar o cuidador | carlos@correo.com | Código de vinculación `482159` |
| Administrador B2B | admin@sedecentral.pe | Código 2FA `482517` |

Contraseña de todos: `Demo1234!`. Tres intentos fallidos bloquean la cuenta 15 minutos.

## Cómo ejecutarlo
Usa módulos ES, así que no funciona abriendo el archivo con doble clic. Ábrelo con un servidor local
(por ejemplo la extensión **Live Server** de VS Code sobre `index.html`) o publícalo en GitHub Pages.

## Estructura
```
index.html (acceso principal)
assets/   images/ icons/ fonts/ videos/
css/      styles.css (tokens y componentes del sistema de diseño)
js/       main.js (arranque y enrutador de cada página) · core/ (estado, simulación) · views/ (auth, admin, usuario, familiar)
pages/    admin.html · usuario.html · familiar.html
docs/     README.md · trazabilidad.md · wireframes.pdf
```
Cada segmento tiene su propia página HTML y solo se abre con su perfil.

## Simulaciones
Voz (`speechSynthesis`), sonidos y audio izquierda/derecha (Web Audio), vibración (`navigator.vibrate` con
indicador visual), balizas Bluetooth y notificaciones push. Todo se simula en el navegador; el estado se comparte
entre módulos con `localStorage`. Activa el botón "Sonido" para oírlas.

## Flujos entre módulos
1. S.O.S. del usuario → alerta en el panel B2B y en la app del familiar.
2. Bloqueo de ruta en el panel → recálculo en la navegación del usuario.
3. Llegada del usuario → notificación de llegada segura al familiar.

## Accesibilidad
Foco visible de 4 px, objetivos de 48 px, enlace para saltar al contenido, estados con texto + icono (no solo color),
avisos con `aria-live`, navegación por teclado (R repite la instrucción) y `prefers-reduced-motion`.

## Equipo
Carrasco Yachi, César Sandro · Chaupin Castro, Miguel Alejandro · De La Cruz Huamani, Oliver Vidal ·
Huapaya Contreras, Santiago Ignacio · Lermo Santos, Henry Manuel · Vidal Luyo, Alfredo Agustin
