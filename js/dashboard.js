import { listarClientes, contarPorStatus, ROTULO_STATUS } from "./clientes.js";
import { obterCache } from "./catalogo.js";
import { obterLog } from "./log.js";

export function render(container) {
  const contagem = contarPorStatus();
  const totalClientes = listarClientes().length;
  const cache = obterCache();
  const log = obterLog().slice(0, 8);

  container.innerHTML = `
    <div class="view-header">
      <h1>Dashboard</h1>
      <p class="muted">Visão geral do Mini-CRM.</p>
    </div>

    <div class="grid-metricas">
      <div class="card metrica">
        <span class="metrica-valor">${totalClientes}</span>
        <span class="metrica-rotulo">Clientes no total</span>
      </div>
      ${["ativo", "pendente", "inadimplente"]
        .map(
          (s) => `
        <div class="card metrica">
          <span class="badge ${s}">${ROTULO_STATUS[s]}</span>
          <span class="metrica-valor">${contagem[s] ?? 0}</span>
        </div>
      `
        )
        .join("")}
      <div class="card metrica">
        <span class="metrica-valor">${cache ? cache.produtos.length : "—"}</span>
        <span class="metrica-rotulo">Produtos no catálogo</span>
      </div>
      <div class="card metrica">
        <span class="metrica-valor">${cache ? cache.categorias.length : "—"}</span>
        <span class="metrica-rotulo">Categorias de produtos</span>
      </div>
    </div>

    ${
      !cache
        ? `<p class="muted">Catálogo ainda não foi carregado — visite a página Catálogo para ver os dados aqui.</p>`
        : ""
    }

    <div class="card">
      <h2 class="secao-titulo">Atividade recente</h2>
      <div class="log">
        ${
          log.length
            ? log
                .map(
                  (item) =>
                    `<div class="linha${item.alerta ? " alerta" : ""}"><span>› ${item.texto}</span><span class="log-hora">${item.hora}</span></div>`
                )
                .join("")
            : `<span class="vazio">Nenhuma ação ainda.</span>`
        }
      </div>
    </div>
  `;
}
