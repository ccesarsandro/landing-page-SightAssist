import { $, st } from "../core/state.js";
import { sim } from "../core/sim.js";

/* Acceso simulado por segmento. Los usuarios se conservan en localStorage para la demo. */
const ROLES = {
  b: {
    nombre: "Persona con discapacidad visual",
    corto: "Usuario",
    icono: "◉",
    descripcion: "Navega por la sede con indicaciones accesibles.",
    mail: "rosa.mendoza@correo.com",
    home: "pages/usuario.html",
  },
  c: {
    nombre: "Familiar o cuidador",
    corto: "Familiar",
    icono: "♧",
    descripcion: "Acompaña el recorrido y recibe alertas de llegada.",
    mail: "carlos@correo.com",
    home: "pages/familiar.html",
    code: "482159",
    paso2: [
      "Verificación de vínculo",
      "Ingresa el código de 6 dígitos para confirmar el acceso.",
    ],
  },
  a: {
    nombre: "Administrador de infraestructura",
    corto: "Administrador B2B",
    icono: "▦",
    descripcion: "Gestiona sedes, rutas, accesos y seguridad.",
    mail: "admin@sedecentral.pe",
    home: "pages/admin.html",
    code: "482517",
    paso2: [
      "Verificación en dos pasos",
      "Ingresa el código de 6 dígitos enviado a tu correo o SMS.",
    ],
  },
};
const CLAVE = "Demo1234!";
const DEFAULT_ACCOUNTS = () => [
  { role: "b", name: "Rosa Mendoza", email: ROLES.b.mail, password: CLAVE },
  { role: "c", name: "Carlos Mendoza", email: ROLES.c.mail, password: CLAVE },
  {
    role: "a",
    name: "Administrador demo",
    email: ROLES.a.mail,
    password: CLAVE,
  },
];
const accounts = () => {
  const stored = st.get("accounts", null);
  if (stored) return stored;
  const initial = DEFAULT_ACCOUNTS();
  st.set("accounts", initial);
  return initial;
};
const AUTH_LOCK_MS = 15 * 60 * 1000;
const authAttemptKey = (role, email) => `${role}:${email}`;
const authAttempts = () => st.get("authAttempts", {}) || {};

const roleCards = () =>
  Object.entries(ROLES)
    .map(
      ([key, role]) => `
  <button class="role-card" type="button" data-role="${key}">
    <span class="role-icon" aria-hidden="true">${role.icono}</span>
    <span><strong>${role.corto}</strong><small>${role.descripcion}</small></span>
    <span class="role-arrow" aria-hidden="true">→</span>
  </button>`,
    )
    .join("");

export const authViews = {
  login: {
    h: () => `<section class="auth-welcome">
        <p class="eyebrow">NAVEGACIÓN INTERIOR ACCESIBLE</p>
        <h1>Tu camino, más claro.</h1>
        <p class="auth-lead">Una experiencia segura y accesible para moverte por espacios complejos con confianza.</p>
        <div class="auth-trust"><span>✓ Diseñado para personas</span><span>✓ Acompañamiento en tiempo real</span></div>
      </section>
      <section class="role-picker" aria-labelledby="role-title">
        <div class="section-heading"><div><h2 id="role-title">¿Cómo usarás SightAssist?</h2><p class="section-subtitle">Elige tu experiencia para continuar.</p></div><span class="badge">3 perfiles</span></div>
        <div class="role-grid">${roleCards()}</div>
      </section>
      <div id="auth-panel" hidden></div>
      <p class="auth-demo-note">Demo académica · Los datos se almacenan solo en este navegador.</p>`,
    i() {
      document.querySelectorAll("[data-role]").forEach(
        (card) =>
          (card.onclick = () => {
            document
              .querySelectorAll("[data-role]")
              .forEach((item) =>
                item.classList.toggle("selected", item === card),
              );
            renderAuth(card.dataset.role, "login");
            $("#auth-panel").scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }),
      );
    },
  },
};

function renderAuth(role, mode, message = "") {
  const r = ROLES[role],
    panel = $("#auth-panel");
  document.body.classList.add("auth-selected");
  document.querySelector(".auth-welcome").hidden = true;
  document.querySelector(".role-picker").hidden = true;
  document.querySelector(".auth-demo-note").hidden = true;
  panel.hidden = false;
  panel.innerHTML = `<section class="auth-panel card" aria-labelledby="auth-title">
    <div class="auth-panel-head"><div><p class="eyebrow">${r.corto.toUpperCase()}</p><h2 id="auth-title">${mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h2></div><button type="button" class="auth-back" id="back-role">Cambiar perfil</button></div>
    <p class="section-subtitle">${mode === "login" ? "Continúa donde lo dejaste en SightAssist." : "Configura tu acceso para esta experiencia."}</p>
    <aside class="auth-side"><span class="auth-side-icon" aria-hidden="true">${r.icono}</span><h3>${r.nombre}</h3><p>${r.descripcion}</p><span class="badge ok">Acceso personalizado</span></aside>
    <div class="auth-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="${mode === "login"}" data-mode="login">Iniciar sesión</button>
      <button type="button" role="tab" aria-selected="${mode === "register"}" data-mode="register">Crear cuenta</button>
    </div>
    <form id="auth-form" novalidate>
      ${mode === "register" ? '<label for="nm">Nombre completo</label><input id="nm" autocomplete="name" required>' : ""}
      ${mode === "register" ? '<label for="ph">Teléfono de contacto</label><input id="ph" type="tel" autocomplete="tel" required>' : ""}
      <label for="em">Correo electrónico</label><input id="em" type="email" autocomplete="username" required>
      <label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" required>
      ${mode === "register" ? '<label for="pw2">Repite tu contraseña</label><input id="pw2" type="password" autocomplete="new-password" required>' : ""}
      <p id="auth-message" role="alert" class="${message ? "err" : ""}">${message}</p>
      ${mode === "login" ? `<details class="demo-access"><summary>Ver credenciales de demostración</summary><p>${r.mail}<br>${CLAVE}${r.code ? `<br>Código: ${r.code}` : ""}</p></details>` : ""}
      <button class="p auth-submit">${mode === "login" ? "Continuar" : "Crear cuenta"}</button>
    </form>
  </section>`;
  $("#back-role").onclick = () => {
    panel.hidden = true;
    document.body.classList.remove("auth-selected");
    document.querySelector(".auth-welcome").hidden = false;
    document.querySelector(".role-picker").hidden = false;
    document.querySelector(".auth-demo-note").hidden = false;
    document
      .querySelectorAll("[data-role]")
      .forEach((item) => item.classList.remove("selected"));
  };
  panel
    .querySelectorAll("[data-mode]")
    .forEach((tab) => (tab.onclick = () => renderAuth(role, tab.dataset.mode)));
  $("#auth-form").onsubmit = (event) => {
    event.preventDefault();
    const msg = $("#auth-message"),
      email = $("#em").value.trim().toLowerCase(),
      password = $("#pw").value;
    if (!email || !email.includes("@")) {
      msg.className = "err";
      msg.textContent = "✖ Ingresa un correo válido.";
      return;
    }
    if (mode === "register") {
      const name = $("#nm").value.trim(),
        confirm = $("#pw2").value;
      if (!name) {
        msg.className = "err";
        msg.textContent = "✖ Ingresa tu nombre completo.";
        return;
      }
      const phone = $("#ph").value.trim();
      if (!/^[0-9+()\s-]{7,}$/.test(phone)) {
        msg.className = "err";
        msg.textContent = "✖ Ingresa un teléfono de contacto válido.";
        return;
      }
      if (password.length < 8) {
        msg.className = "err";
        msg.textContent = "✖ La contraseña debe tener al menos 8 caracteres.";
        return;
      }
      if (password !== confirm) {
        msg.className = "err";
        msg.textContent = "✖ Las contraseñas no coinciden.";
        return;
      }
      if (accounts().some((user) => user.email === email)) {
        msg.className = "err";
        msg.textContent = "✖ Ya existe una cuenta con ese correo.";
        return;
      }
      st.set("accounts", [...accounts(), { role, name, email, password, phone }]);
      sim.buzz(200, "Cuenta creada");
      renderAuth(
        role,
        "login",
        "✔ Cuenta creada. Ahora puedes iniciar sesión.",
      );
      $("#em").value = email;
      return;
    }
    const account = accounts().find(
      (user) =>
        user.role === role &&
        user.email === email &&
        user.password === password,
    );
    const attempts = authAttempts();
    const key = authAttemptKey(role, email);
    const record = attempts[key] || { count: 0, lockedUntil: 0 };
    if (record.lockedUntil > Date.now()) {
      const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      msg.className = "err";
      msg.textContent = `✖ Cuenta bloqueada temporalmente. Intenta nuevamente en ${minutes} min.`;
      return;
    }
    if (!account) {
      record.count += 1;
      if (record.count >= 3) {
        record.count = 0;
        record.lockedUntil = Date.now() + AUTH_LOCK_MS;
        msg.textContent = "✖ Cuenta bloqueada durante 15 minutos por seguridad.";
      } else {
        msg.textContent = `✖ Correo o contraseña incorrectos. Intento ${record.count} de 3.`;
      }
      attempts[key] = record;
      st.set("authAttempts", attempts);
      msg.className = "err";
      sim.say("Datos incorrectos");
      return;
    }
    delete attempts[key];
    st.set("authAttempts", attempts);
    if (r.code) return renderCode(role, account);
    enter(role, account);
  };
}

function renderCode(role, account) {
  const r = ROLES[role],
    panel = $("#auth-panel");
  panel.innerHTML = `<section class="auth-panel card" aria-labelledby="code-title">
    <div class="auth-panel-head"><div><p class="eyebrow">${r.corto.toUpperCase()}</p><h2 id="code-title">${r.paso2[0]}</h2></div><button type="button" class="auth-back" id="back-auth">Volver</button></div>
    <p class="section-subtitle">${r.paso2[1]}</p>
    <form id="code-form" novalidate><div class="auth-code" role="group" aria-label="Código de 6 dígitos">${[1, 2, 3, 4, 5, 6].map((n) => `<input class="auth-digit" inputmode="numeric" maxlength="1" aria-label="Dígito ${n}">`).join("")}</div>
      <p class="hint">Código de demostración: ${r.code}</p><p id="code-message" role="alert"></p><button class="p">Verificar código</button><button type="button" class="btn-secondary" id="resend-code">Reenviar código</button></form>
  </section>`;
  $("#back-auth").onclick = () => renderAuth(role, "login");
  const digits = [...document.querySelectorAll(".auth-digit")];
  digits.forEach((input, index) => {
    input.oninput = () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && digits[index + 1]) digits[index + 1].focus();
    };
    input.onkeydown = (event) => {
      if (event.key === "Backspace" && !input.value && digits[index - 1])
        digits[index - 1].focus();
    };
  });
  $("#code-form").onsubmit = (event) => {
    event.preventDefault();
    const msg = $("#code-message");
    if (digits.map((input) => input.value).join("") !== r.code) {
      msg.className = "err";
      msg.textContent = "✖ Código incorrecto.";
      return;
    }
    enter(role, account);
  };
  $("#resend-code").onclick = () => {
    $("#code-message").className = "ok";
    $("#code-message").textContent =
      "✔ Se envió un nuevo código de demostración.";
  };
}

function enter(role, account) {
  st.set("role", role);
  st.set("session", {
    name: account?.name || ROLES[role].nombre,
    email: account?.email || ROLES[role].mail,
  });
  sim.tone(880);
  sim.say("Bienvenido a SightAssist");
  location.href = ROLES[role].home;
}
