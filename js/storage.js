window.App = window.App || {};

(function () {
  "use strict";

  var STORAGE_KEY = "minicrm:clientes";
  var SCHEMA_VERSION = 1;

  var estado = null; // { version, nextId, clientes }

  // Cada chamada retorna um objeto novo — é isso que evita o bug do
  // status compartilhado (antes todos os clientes apontavam para o
  // mesmo literal `statusPadrao`, e mudar um mudava todos).
  function criarStatus(valorInicial) {
    return { valor: valorInicial || "ativo", atualizadoEm: null };
  }

  function seedPadrao() {
    return [
      { nome: "Ana Souza", plano: "Pro" },
      { nome: "Bruno Lima", plano: "Básico" },
      { nome: "Carla Dias", plano: "Enterprise" },
    ].map(function (c, i) {
      return { id: i + 1, nome: c.nome, plano: c.plano, status: criarStatus("ativo") };
    });
  }

  function salvar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      console.warn("Não foi possível salvar clientes no localStorage:", e);
    }
  }

  function carregar() {
    if (estado) return;
    var bruto = null;
    try {
      bruto = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      bruto = null;
    }

    if (bruto && bruto.version === SCHEMA_VERSION && Array.isArray(bruto.clientes)) {
      estado = bruto;
    } else {
      var clientes = seedPadrao();
      estado = { version: SCHEMA_VERSION, nextId: clientes.length + 1, clientes: clientes };
      salvar();
    }
  }

  function dispararMudanca() {
    window.dispatchEvent(new CustomEvent("clientes:changed", { detail: { clientes: getClientes() } }));
  }

  function getClientes() {
    carregar();
    return estado.clientes.map(function (c) {
      return { id: c.id, nome: c.nome, plano: c.plano, status: { valor: c.status.valor, atualizadoEm: c.status.atualizadoEm } };
    });
  }

  function addCliente(dados) {
    carregar();
    var nome = (dados && dados.nome || "").trim();
    if (!nome) throw new Error("Informe o nome do cliente.");
    var plano = (dados && dados.plano || "").trim() || "Básico";
    var statusInicial = (dados && dados.statusInicial) || "ativo";

    var cliente = { id: estado.nextId, nome: nome, plano: plano, status: criarStatus(statusInicial) };
    estado.clientes.push(cliente);
    estado.nextId += 1;
    salvar();
    dispararMudanca();
    return cliente;
  }

  function removerCliente(id) {
    carregar();
    var alvo = estado.clientes.find(function (c) { return c.id === id; });
    estado.clientes = estado.clientes.filter(function (c) { return c.id !== id; });
    salvar();
    dispararMudanca();
    return alvo || null;
  }

  function mudarStatus(id, novoValor) {
    carregar();
    var cliente = estado.clientes.find(function (c) { return c.id === id; });
    if (!cliente) return null;
    cliente.status.valor = novoValor;
    cliente.status.atualizadoEm = new Date().toLocaleTimeString("pt-BR");
    salvar();
    dispararMudanca();
    return { id: cliente.id, nome: cliente.nome, plano: cliente.plano, status: { valor: cliente.status.valor, atualizadoEm: cliente.status.atualizadoEm } };
  }

  App.storage = {
    getClientes: getClientes,
    addCliente: addCliente,
    removerCliente: removerCliente,
    mudarStatus: mudarStatus,
  };
})();
