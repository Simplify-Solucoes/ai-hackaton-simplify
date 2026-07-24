const store = require("./store");
const { hashPassword } = require("./auth");

function seed() {
  if (store.read("clientes").length === 0) {
    store.write("clientes", [
      {
        id: 1,
        nome: "Ana Souza",
        plano: "Pro",
        status: { valor: "ativo", atualizadoEm: null },
      },
      {
        id: 2,
        nome: "Bruno Lima",
        plano: "Básico",
        status: { valor: "pendente", atualizadoEm: null },
      },
      {
        id: 3,
        nome: "Carla Dias",
        plano: "Enterprise",
        status: { valor: "inadimplente", atualizadoEm: null },
      },
    ]);
  }

  if (store.read("produtos").length === 0) {
    store.write("produtos", [
      {
        id: 1,
        nome: 'Notebook 14"',
        categoria: "Eletrônicos",
        preco: 3499.9,
        estoque: 12,
      },
      {
        id: 2,
        nome: "Mouse sem fio",
        categoria: "Acessórios",
        preco: 89.9,
        estoque: 45,
      },
      {
        id: 3,
        nome: "Cadeira ergonômica",
        categoria: "Móveis",
        preco: 1290.0,
        estoque: 3,
      },
    ]);
  }

  if (store.read("usuarios").length === 0) {
    const { salt, hash } = hashPassword("admin123");
    store.write("usuarios", [{ usuario: "admin", salt, hash }]);
  }
}

module.exports = { seed };
