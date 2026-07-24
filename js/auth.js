import { loadSession, saveSession, clearSession } from "./storage.js";
import { login as apiLogin } from "./api.js";

const SESSION_KEY = "auth.v1";

export function getSession() {
  return loadSession(SESSION_KEY, null);
}

export function isAuthenticated() {
  return Boolean(getSession()?.token);
}

export function logout() {
  clearSession(SESSION_KEY);
}

export function render(container, { onLoginSuccess } = {}) {
  container.innerHTML = `
    <div class="auth-shell">
      <form id="login-form" class="card auth-card" novalidate>
        <h1>Mini-CRM Lite</h1>
        <p class="muted">Entre com sua conta da fakestoreapi para acessar os dados.</p>

        <label for="login-username">Usuário</label>
        <input id="login-username" name="username" type="text" autocomplete="username" required />

        <label for="login-password">Senha</label>
        <input id="login-password" name="password" type="password" autocomplete="current-password" required />

        <button type="submit">Entrar</button>

        <p class="hint">Conta de teste pública da fakestoreapi: usuário <code>mor_2314</code>, senha <code>83r5^_</code>.</p>
        <p id="login-erro" class="erro" role="alert" hidden></p>
      </form>
    </div>
  `;

  const form = container.querySelector("#login-form");
  const erroEl = container.querySelector("#login-erro");
  const botao = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username || !password) {
      erroEl.textContent = "Informe usuário e senha.";
      erroEl.hidden = false;
      return;
    }

    botao.disabled = true;
    botao.textContent = "Entrando...";
    try {
      const resposta = await apiLogin(username, password);
      saveSession(SESSION_KEY, { token: resposta.token, username });
      onLoginSuccess?.();
    } catch (err) {
      erroEl.textContent = "Não foi possível entrar. Verifique usuário/senha ou sua conexão e tente novamente.";
      erroEl.hidden = false;
    } finally {
      botao.disabled = false;
      botao.textContent = "Entrar";
    }
  });
}
