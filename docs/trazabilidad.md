# Trazabilidad HU → vista implementada

Cada vista corresponde al prototipo de Figma (vistas 1 a 32). Archivos: `js/views/`.

## Selección para la presentación

La landing implementa 36 HU en total. Para la presentación se consideran 30 HU core:

`HU-001`, `HU-002`, `HU-003`, `HU-004`, `HU-008`, `HU-010`, `HU-011`, `HU-012`,
`HU-013`, `HU-014`, `HU-015`, `HU-016`, `HU-017`, `HU-018`, `HU-019`, `HU-020`,
`HU-023`, `HU-025`, `HU-026`, `HU-027`, `HU-028`, `HU-029`, `HU-031`, `HU-032`,
`HU-034`, `HU-041`, `HU-042`, `HU-044`, `HU-046` y `HU-048`.

Las siguientes 6 HU se mantienen implementadas como funcionalidades complementarias,
pero no se consideran dentro del mínimo core: `HU-006`, `HU-021`, `HU-022`, `HU-024`,
`HU-030` y `HU-038`. La selección prioriza las HU Must Have y Should Have y las
funcionalidades directamente relacionadas con autenticación, navegación indoor,
acompañamiento, seguridad y operación de la sede.

| HU | Vistas donde se implementa |
|---|---|
| HU-001 | Acceso (index.html) · auth.js; Usuario · perfil |
| HU-002 | Acceso (index.html) · auth.js; Familiar · vincular |
| HU-003 | Acceso (index.html) · auth.js |
| HU-004 | Usuario · ajustes |
| HU-006 | Usuario · ajustes |
| HU-008 | Acceso (index.html) · auth.js; Usuario · perfil |
| HU-010 | Usuario · destino |
| HU-011 | Usuario · nav |
| HU-012 | Usuario · nav |
| HU-013 | Usuario · nav; Usuario · obstaculo |
| HU-014 | Usuario · llegada |
| HU-015 | Usuario · obstaculo |
| HU-016 | Usuario · destino; Usuario · servicios |
| HU-017 | Familiar · push |
| HU-018 | Familiar · monitoreo |
| HU-019 | Usuario · nav; Familiar · sos |
| HU-020 | Familiar · alertas |
| HU-021 | Familiar · historial |
| HU-022 | Familiar · alertas |
| HU-023 | Familiar · vincular; Familiar · privacidad |
| HU-024 | Familiar · mensajes |
| HU-025 | Admin · centro |
| HU-026 | Admin · bloqueo |
| HU-027 | Admin · bloqueo |
| HU-028 | Admin · editor |
| HU-029 | Admin · bloqueo |
| HU-030 | Admin · analiticas |
| HU-031 | Admin · analiticas |
| HU-032 | Admin · centro; Admin · alertas |
| HU-034 | Usuario · ruta |
| HU-038 | Admin · sede |
| HU-041 | Acceso (index.html) · auth.js; Admin · roles |
| HU-042 | Admin · editor |
| HU-044 | Admin · alertas |
| HU-046 | Usuario · llegada |
| HU-048 | Admin · sede |

Total: 36 HUs distintas implementadas.
