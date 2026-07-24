window.App = window.App || {};

(function () {
  "use strict";

  var PLANOS_CONHECIDOS = ["Básico", "Pro", "Enterprise"];
  var CORES_STATUS = { ativo: "var(--ativo-fg)", pendente: "var(--pend-fg)", inadimplente: "var(--inad-fg)" };
  var CORES_PLANO = { "Básico": "var(--plan-basico)", "Pro": "var(--plan-pro)", "Enterprise": "var(--plan-enterprise)", "Outro": "var(--plan-outro)" };
  var ROTULO_STATUS = { ativo: "Ativo", pendente: "Pendente", inadimplente: "Inadimplente" };

  var elStats, elChartStatus, elChartPlano;

  function computeMetrics(clientes) {
    var porStatus = { ativo: 0, pendente: 0, inadimplente: 0 };
    var porPlano = { "Básico": 0, "Pro": 0, "Enterprise": 0, "Outro": 0 };

    clientes.forEach(function (c) {
      if (porStatus[c.status.valor] !== undefined) porStatus[c.status.valor] += 1;
      var chave = PLANOS_CONHECIDOS.indexOf(c.plano) !== -1 ? c.plano : "Outro";
      porPlano[chave] += 1;
    });

    return { total: clientes.length, porStatus: porStatus, porPlano: porPlano };
  }

  function renderBarChart(container, entries) {
    var max = Math.max(1, Math.max.apply(null, entries.map(function (e) { return e.count; })));
    container.innerHTML = "";

    entries.forEach(function (e) {
      var pct = (e.count / max) * 100;
      var row = document.createElement("div");
      row.className = "chart-row";
      row.innerHTML =
        '<span class="chart-label"></span>' +
        '<svg viewBox="0 0 100 10" preserveAspectRatio="none">' +
        '<rect x="0" y="0" width="100" height="10" rx="4" fill="var(--line)"></rect>' +
        '<rect x="0" y="0" height="10" rx="4"></rect>' +
        "</svg>" +
        '<span class="chart-count"></span>';
      row.querySelector(".chart-label").textContent = e.label;
      row.querySelector(".chart-count").textContent = e.count;
      var rectValor = row.querySelectorAll("rect")[1];
      rectValor.setAttribute("width", pct);
      rectValor.setAttribute("fill", e.color);
      container.appendChild(row);
    });
  }

  function statTile(label, value, cor) {
    var dot = cor ? '<span class="dot" style="background:' + cor + '"></span>' : "";
    return (
      '<div class="stat-tile"><div class="stat-label">' + dot + label + "</div>" +
      '<div class="stat-value">' + value + "</div></div>"
    );
  }

  function render() {
    var clientes = App.storage.getClientes();
    var m = computeMetrics(clientes);

    elStats.innerHTML =
      statTile("Total de clientes", m.total) +
      statTile("Ativos", m.porStatus.ativo, CORES_STATUS.ativo) +
      statTile("Pendentes", m.porStatus.pendente, CORES_STATUS.pendente) +
      statTile("Inadimplentes", m.porStatus.inadimplente, CORES_STATUS.inadimplente);

    renderBarChart(
      elChartStatus,
      Object.keys(m.porStatus).map(function (s) {
        return { label: ROTULO_STATUS[s], count: m.porStatus[s], color: CORES_STATUS[s] };
      })
    );

    renderBarChart(
      elChartPlano,
      Object.keys(m.porPlano)
        .filter(function (p) { return m.porPlano[p] > 0 || p !== "Outro"; })
        .map(function (p) { return { label: p, count: m.porPlano[p], color: CORES_PLANO[p] }; })
    );
  }

  function init() {
    elStats = document.getElementById("dashboard-stats");
    elChartStatus = document.getElementById("chart-status");
    elChartPlano = document.getElementById("chart-plano");
    window.addEventListener("clientes:changed", render);
    render();
  }

  App.dashboard = { init: init };
})();
