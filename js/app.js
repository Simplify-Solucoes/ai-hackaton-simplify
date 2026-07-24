window.App = window.App || {};

(function () {
  "use strict";

  var AUTH_KEY = "minicrm:auth";
  var VIEWS = ["dashboard", "clientes", "catalogo"];

  function lerAuth() {
    try {
      return JSON.parse(sessionStorage.getItem(AUTH_KEY));
    } catch (e) {
      return null;
    }
  }

  function renderAuthBadge() {
    var el = document.getElementById("auth-badge");
    var auth = lerAuth();
    if (auth && auth.username) {
      el.innerHTML =
        "<span>Logado como <strong></strong></span> " +
        '<a href="#" id="auth-sair">Sair</a>';
      el.querySelector("strong").textContent = auth.username;
      el.querySelector("#auth-sair").addEventListener("click", function (e) {
        e.preventDefault();
        sessionStorage.removeItem(AUTH_KEY);
        renderAuthBadge();
      });
    } else {
      el.innerHTML = '<a href="login.html">Entrar</a>';
    }
  }

  function ativarView(nome) {
    if (VIEWS.indexOf(nome) === -1) nome = "dashboard";

    VIEWS.forEach(function (v) {
      document.getElementById("view-" + v).hidden = v !== nome;
      document.querySelector('.navlink[data-view="' + v + '"]').classList.toggle("active", v === nome);
    });

    if (nome === "catalogo") App.catalogo.ativar();
    location.hash = "/" + nome;
  }

  function init() {
    renderAuthBadge();

    document.querySelectorAll(".navlink[data-view]").forEach(function (btn) {
      btn.addEventListener("click", function () { ativarView(btn.dataset.view); });
    });

    App.clientes.init();
    App.catalogo.init();
    App.dashboard.init();

    var inicial = (location.hash || "").replace("#/", "");
    ativarView(inicial || "dashboard");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
