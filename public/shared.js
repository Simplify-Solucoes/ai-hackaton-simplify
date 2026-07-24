const AUTH_KEY = "mcrm_token";
const USER_KEY = "mcrm_usuario";

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function guardAuth() {
  if (!getToken()) {
    window.location.replace("login.html");
  }
}

async function apiFetch(url, options = {}) {
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {},
  );
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(url, Object.assign({}, options, { headers }));

  if (res.status === 401) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace("login.html");
    throw new Error("Não autenticado");
  }
  return res;
}

async function apiJson(url, options) {
  const res = await apiFetch(url, options);
  const dados = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error((dados && dados.erro) || "Erro na requisição");
  }
  return dados;
}

function logout() {
  apiFetch("/api/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "login.html";
}

function formatoMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function showToast(mensagem, variante = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = 1080;
    document.body.appendChild(container);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${variante} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensagem}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function montarNavbar(paginaAtiva) {
  const usuario = localStorage.getItem(USER_KEY) || "";
  const links = [
    { href: "index.html", label: "Dashboard", chave: "dashboard" },
    { href: "clientes.html", label: "Clientes", chave: "clientes" },
    { href: "produtos.html", label: "Produtos", chave: "produtos" },
  ];

  const itens = links
    .map(
      (l) => `
      <li class="nav-item">
        <a class="nav-link ${l.chave === paginaAtiva ? "active" : ""}" href="${l.href}">${l.label}</a>
      </li>`,
    )
    .join("");

  return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container-fluid">
        <a class="navbar-brand fw-semibold" href="index.html">Mini-CRM Lite</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">${itens}</ul>
          <span class="navbar-text text-light me-3">Olá, ${usuario}</span>
          <button class="btn btn-outline-light btn-sm" id="btn-logout">Sair</button>
        </div>
      </div>
    </nav>
  `;
}

function iniciarPagina(paginaAtiva) {
  guardAuth();
  document.getElementById("navbar-container").innerHTML =
    montarNavbar(paginaAtiva);
  document.getElementById("btn-logout").addEventListener("click", logout);
}
