window.App = window.App || {};

(function () {
  "use strict";

  var STATUS = ["ativo", "pendente", "inadimplente"];
  var ROTULO = { ativo: "Ativo", pendente: "Pendente", inadimplente: "Inadimplente" };

  var elTbody, elForm, elNome, elPlano, elStatus, elErroNome, elLog;

  function render() {
    var clientes = App.storage.getClientes();
    elTbody.innerHTML = "";

    if (!clientes.length) {
      elTbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">Nenhum cliente cadastrado ainda.</div></td></tr>';
      return;
    }

    clientes.forEach(function (c) {
      var tr = document.createElement("tr");
      var icone = c.status.valor === "inadimplente" ? "⚠ " : "";
      var options = STATUS.map(function (s) {
        return '<option value="' + s + '" ' + (s === c.status.valor ? "selected" : "") + ">" + ROTULO[s] + "</option>";
      }).join("");

      tr.innerHTML =
        "<td><span class=\"nome\"></span></td>" +
        "<td></td>" +
        '<td><span class="badge ' + c.status.valor + '">' + icone + ROTULO[c.status.valor] + "</span></td>" +
        '<td class="col-acao"><select data-id="' + c.id + '">' + options + "</select></td>" +
        '<td class="col-acao"><button type="button" class="btn-danger" data-remover-id="' + c.id + '">Remover</button></td>';

      tr.querySelector(".nome").textContent = c.nome;
      tr.children[1].textContent = c.plano;
      elTbody.appendChild(tr);
    });
  }

  function registrarLog(texto, alerta) {
    var vazio = elLog.querySelector(".vazio");
    if (vazio) vazio.remove();
    var linha = document.createElement("div");
    linha.className = "linha" + (alerta ? " alerta" : "");
    linha.textContent = "› " + texto;
    elLog.prepend(linha);
  }

  function onMudarStatus(id, novoValor) {
    var cliente = App.storage.mudarStatus(id, novoValor);
    if (!cliente) return;
    if (novoValor === "inadimplente") {
      registrarLog("⚠ Ação disparada: " + cliente.nome + " ficou INADIMPLENTE (" + cliente.status.atualizadoEm + ")", true);
    } else {
      registrarLog(cliente.nome + " → " + ROTULO[novoValor] + " (" + cliente.status.atualizadoEm + ")");
    }
  }

  function onRemover(id) {
    var removido = App.storage.removerCliente(id);
    if (removido) registrarLog("Cliente removido: " + removido.nome);
  }

  function onSubmit(e) {
    e.preventDefault();
    elErroNome.textContent = "";
    try {
      var cliente = App.storage.addCliente({
        nome: elNome.value,
        plano: elPlano.value,
        statusInicial: elStatus.value,
      });
      registrarLog("Cliente adicionado: " + cliente.nome + " (" + cliente.plano + ")");
      elForm.reset();
      elNome.focus();
    } catch (err) {
      elErroNome.textContent = err.message;
    }
  }

  function init() {
    elTbody = document.getElementById("tbody-clientes");
    elForm = document.getElementById("form-cliente");
    elNome = document.getElementById("input-nome");
    elPlano = document.getElementById("input-plano");
    elStatus = document.getElementById("input-status");
    elErroNome = document.getElementById("erro-nome");
    elLog = document.getElementById("log");

    elLog.innerHTML = '<span class="vazio">Nenhuma ação ainda.</span>';

    elTbody.addEventListener("change", function (e) {
      if (e.target.matches("select[data-id]")) {
        onMudarStatus(Number(e.target.dataset.id), e.target.value);
      }
    });
    elTbody.addEventListener("click", function (e) {
      if (e.target.matches("[data-remover-id]")) {
        onRemover(Number(e.target.dataset.removerId));
      }
    });
    elForm.addEventListener("submit", onSubmit);
    window.addEventListener("clientes:changed", render);

    render();
  }

  App.clientes = { init: init };
})();
