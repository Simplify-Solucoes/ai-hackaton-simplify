import { loadJSON, saveJSON } from "./storage.js";
import { fetchProdutos, fetchCategorias } from "./api.js";

const CACHE_KEY = "catalogo-cache.v1";

function formatarPreco(preco) {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "USD" });
}

export function obterCache() {
  return loadJSON(CACHE_KEY, null);
}

function salvarCache(produtos, categorias) {
  saveJSON(CACHE_KEY, { produtos, categorias });
}

export function render(container) {
  container.innerHTML = `
    <div class="view-header">
      <h1>Catálogo de produtos</h1>
      <p class="muted">Dados públicos de <a href="https://fakestoreapi.com" target="_blank" rel="noopener">fakestoreapi.com</a>.</p>
    </div>

    <div class="bar">
      <label for="filtro-categoria" class="muted" style="margin:0;">Categoria</label>
      <select id="filtro-categoria" disabled style="width:auto;">
        <option value="">Todas</option>
      </select>
    </div>

    <div id="catalogo-estado"></div>
    <div id="catalogo-grid" class="grid-produtos"></div>
  `;

  const estadoEl = container.querySelector("#catalogo-estado");
  const gridEl = container.querySelector("#catalogo-grid");
  const filtroEl = container.querySelector("#filtro-categoria");

  let produtos = [];

  function renderGrid(lista) {
    gridEl.innerHTML = lista
      .map(
        (p) => `
      <div class="card produto-card">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
        <div class="produto-info">
          <span class="produto-categoria">${p.category}</span>
          <h3>${p.title}</h3>
          <span class="produto-preco">${formatarPreco(p.price)}</span>
        </div>
      </div>
    `
      )
      .join("");
  }

  function aplicarFiltro() {
    const categoria = filtroEl.value;
    renderGrid(categoria ? produtos.filter((p) => p.category === categoria) : produtos);
  }

  filtroEl.addEventListener("change", aplicarFiltro);

  async function carregar() {
    estadoEl.innerHTML = `<p class="muted">Carregando produtos...</p>`;
    gridEl.innerHTML = "";
    filtroEl.disabled = true;

    try {
      const [produtosResp, categoriasResp] = await Promise.all([fetchProdutos(), fetchCategorias()]);
      produtos = produtosResp;
      salvarCache(produtosResp, categoriasResp);

      filtroEl.innerHTML =
        `<option value="">Todas</option>` +
        categoriasResp.map((c) => `<option value="${c}">${c}</option>`).join("");
      filtroEl.disabled = false;

      estadoEl.innerHTML = "";
      renderGrid(produtos);
    } catch (err) {
      estadoEl.innerHTML = `
        <div class="card erro-card">
          <p>Não foi possível carregar o catálogo agora. Verifique sua conexão e tente novamente.</p>
          <button type="button" id="btn-retry-catalogo">Tentar novamente</button>
        </div>
      `;
      estadoEl.querySelector("#btn-retry-catalogo").addEventListener("click", carregar);
    }
  }

  carregar();
}
