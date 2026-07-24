window.App = window.App || {};

(function () {
  "use strict";

  var AUTH_KEY = "minicrm:auth";

  function init() {
    var form = document.getElementById("form-login");
    var btn = document.getElementById("btn-login");
    var feedback = document.getElementById("auth-feedback");
    var username = document.getElementById("input-username");
    var password = document.getElementById("input-password");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      feedback.textContent = "";
      feedback.className = "auth-feedback";

      if (!username.value.trim() || !password.value) {
        feedback.textContent = "Informe usuário e senha.";
        feedback.classList.add("erro");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Entrando…";

      App.api.login(username.value.trim(), password.value)
        .then(function (resp) {
          var auth = { token: resp.token, username: username.value.trim(), loginEm: new Date().toISOString() };
          try {
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
          } catch (e) {}

          form.hidden = true;
          document.querySelector(".auth-hint").hidden = true;
          var sucesso = document.getElementById("auth-success");
          sucesso.hidden = false;
          document.getElementById("auth-success-user").textContent = auth.username;
          document.getElementById("auth-success-token").textContent = resp.token;
        })
        .catch(function (err) {
          feedback.textContent = err.message;
          feedback.classList.add("erro");
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = "Entrar";
        });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
