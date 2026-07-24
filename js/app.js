import * as auth from "./auth.js";
import * as dashboard from "./dashboard.js";
import * as clientes from "./clientes.js";
import * as catalogo from "./catalogo.js";

const view = document.getElementById("view");
const header = document.getElementById("app-header");
const nav = document.getElementById("app-nav");
const btnLogout = document.getElementById("btn-logout");

function rotaAtual() {
  return location.hash.replace(/^#\/?/, "") || "";
}

function navegar(rota) {
  location.hash = `#/${rota}`;
}

function atualizarNav(rotaAtiva) {
  nav.querySelectorAll("a[data-route]").forEach((link) => {
    link.classList.toggle("ativo", link.dataset.route === rotaAtiva);
  });
}

function rotear() {
  const rota = rotaAtual();
  const autenticado = auth.isAuthenticated();

  header.hidden = !autenticado;

  if (!autenticado) {
    if (rota !== "login") {
      navegar("login");
      return;
    }
    auth.render(view, { onLoginSuccess: () => navegar("dashboard") });
    return;
  }

  if (rota === "login" || rota === "") {
    navegar("dashboard");
    return;
  }

  atualizarNav(rota);

  switch (rota) {
    case "clientes":
      clientes.render(view);
      break;
    case "catalogo":
      catalogo.render(view);
      break;
    case "dashboard":
      dashboard.render(view);
      break;
    default:
      navegar("dashboard");
  }
}

btnLogout.addEventListener("click", () => {
  auth.logout();
  navegar("login");
  rotear();
});

window.addEventListener("hashchange", rotear);

if (!location.hash) {
  navegar(auth.isAuthenticated() ? "dashboard" : "login");
}
rotear();
