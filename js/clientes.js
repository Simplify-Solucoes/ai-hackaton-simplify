import { loadJSON, saveJSON } from "./storage.js";
import { registrarLog } from "./log.js";

const CLIENTES_KEY = "clientes.v1";

export const STATUS = ["ativo", "pendente", "inadimplente"];
export const ROTULO_STATUS = { ativo: "Ativo", pendente: "Pendente", inadimplente: "Inadimplente" };

// Cada cliente recebe seu PRÓPRIO objeto de status — nunca uma referência
// compartilhada — para evitar que alterar um cliente afete os demais.
function statusInicial() {
  return { valor: "ativo", atualizadoEm: null };
}

function seed() {
  return [
    { id: 1, nome: "Ana Souza", plano: "Pro", status: statusInicial() },
    { id: 2, nome: "Bruno Lima", plano: "Básico", status: statusInicial() },
    { id: 3, nome: "Carla Dias", plano: "Enterprise", status: statusInicial() },
  ];
}

function normalizar(lista) {
  return lista.map((c) => ({
    ...c,
    status: {
      valor: c.status?.valor ?? "ativo",
      atualizadoEm: c.status?.atualizadoEm ?? null,
    },
  }));
}

let clientes = normalizar(loadJSON(CLIENTES_KEY, null) ?? seed());
persistir();

function persistir() {
  saveJSON(CLIENTES_KEY, clientes);
}

export function listarClientes() {
  return clientes;
}

export function contarPorStatus() {
  const contagem = { ativo: 0, pendente: 0, inadimplente: 0 };
  for (const c of clientes) {
    contagem[c.status.valor] = (contagem[c.status.valor] ?? 0) + 1;
  }
  return contagem;
}

function proximoId() {
  return clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
}

export function adicionarCliente(nome, plano) {
  const nomeLimpo = (nome || "").trim();
  if (!nomeLimpo) {
    throw new Error("Informe o nome do cliente.");
  }
  const cliente = {
    id: proximoId(),
    nome: nomeLimpo,
    plano: (plano || "").trim() || "Básico",
    status: statusInicial(),
  };
  clientes.push(cliente);
  persistir();
  registrarLog(`Cliente cadastrado: ${cliente.nome} (${cliente.plano})`);
  return cliente;
}

export function removerCliente(id) {
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) return;
  clientes = clientes.filter((c) => c.id !== id);
  persistir();
  registrarLog(`Cliente removido: ${cliente.nome}`);
}

export function mudarStatus(id, novoValor) {
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) return;
  const agora = new Date().toLocaleTimeString("pt-BR");
  cliente.status = { valor: novoValor, atualizadoEm: agora };
  persistir();

  if (novoValor === "inadimplente") {
    registrarLog(`⚠ Ação disparada: ${cliente.nome} ficou INADIMPLENTE (${agora})`, true);
  } else {
    registrarLog(`${cliente.nome} → ${ROTULO_STATUS[novoValor]} (${agora})`);
  }
}

export function render(container) {
  container.innerHTML = `
    <div class="view-header">
      <h1>Clientes</h1>
      <p class="muted">Gestão de clientes, com persistência local.</p>
    </div>

    <form id="form-novo-cliente" class="card form-inline" novalidate>
      <div class="campo">
        <label for="novo-nome">Nome</label>
        <input id="novo-nome" name="nome" type="text" placeholder="Nome do cliente" required />
      </div>
      <div class="campo">
        <label for="novo-plano">Plano</label>
        <select id="novo-plano" name="plano">
          <option value="Básico">Básico</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>
      <button type="submit">Adicionar cliente</button>
      <p id="form-erro" class="erro" role="alert" hidden></p>
    </form>

    <div class="card table-card">
      <table>
        <thead>
          <tr><th>Nome</th><th>Plano</th><th>Status</th><th>Alterar</th><th></th></tr>
        </thead>
        <tbody id="tbody-clientes"></tbody>
      </table>
    </div>
  `;

  const form = container.querySelector("#form-novo-cliente");
  const erroEl = container.querySelector("#form-erro");

  function redesenharTabela() {
    const tbody = container.querySelector("#tbody-clientes");
    tbody.innerHTML = "";

    for (const c of clientes) {
      const tr = document.createElement("tr");
      const icone = c.status.valor === "inadimplente" ? "⚠ " : "";
      const opcoes = STATUS.map(
        (s) => `<option value="${s}" ${s === c.status.valor ? "selected" : ""}>${ROTULO_STATUS[s]}</option>`
      ).join("");

      tr.innerHTML = `
        <td><span class="nome">${c.nome}</span></td>
        <td>${c.plano}</td>
        <td><span class="badge ${c.status.valor}">${icone}${ROTULO_STATUS[c.status.valor]}</span></td>
        <td><select data-id="${c.id}">${opcoes}</select></td>
        <td><button type="button" class="btn-ghost btn-remover" data-id="${c.id}">Remover</button></td>
      `;
      tbody.appendChild(tr);
    }
  }

  redesenharTabela();

  container.addEventListener("change", (e) => {
    if (e.target.matches("select[data-id]")) {
      mudarStatus(Number(e.target.dataset.id), e.target.value);
      redesenharTabela();
    }
  });

  container.addEventListener("click", (e) => {
    if (e.target.matches(".btn-remover")) {
      const id = Number(e.target.dataset.id);
      const cliente = clientes.find((c) => c.id === id);
      if (cliente && confirm(`Remover o cliente "${cliente.nome}"?`)) {
        removerCliente(id);
        redesenharTabela();
      }
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    erroEl.hidden = true;
    try {
      adicionarCliente(form.nome.value, form.plano.value);
      form.reset();
      redesenharTabela();
    } catch (err) {
      erroEl.textContent = err.message;
      erroEl.hidden = false;
    }
  });
}
