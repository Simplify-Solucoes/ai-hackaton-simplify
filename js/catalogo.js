window.App = window.App || {};

(function () {
  "use strict";

  var TODAS = "__todas__";

  var elPills, elConteudo;
  var carregado = false;
  var categoriaAtiva = TODAS;
  var cache = { categorias: null, produtos: {} }; // produtos[categoria] -> array

  function labelCategoria(cat) {
    return cat.replace(/(^|\s)\w/g, function (m) { return m.toUpperCase(); });
  }

  function renderSkeleton() {
    var html = "";
    for (var i = 0; i < 8; i++) html += '<div class="skeleton"></div>';
    elConteudo.innerHTML = '<div class="product-grid">' + html + "</div>";
  }

  function renderErro(mensagem, tentarNovamente) {
    var box = document.createElement("div");
    box.className = "error-state";
    var texto = document.createElement("p");
    texto.textContent = mensagem;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Tentar novamente";
    btn.addEventListener("click", tentarNovamente);
    box.appendChild(texto);
    box.appendChild(btn);
    elConteudo.innerHTML = "";
    elConteudo.appendChild(box);
  }

  function renderProdutos(produtos) {
    if (!produtos.length) {
      elConteudo.innerHTML = '<div class="empty-state">Nenhum produto encontrado nessa categoria.</div>';
      return;
    }
    var grid = document.createElement("div");
    grid.className = "product-grid";

    produtos.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML =
        '<div class="thumb"><img loading="lazy" alt=""></div>' +
        '<div class="info">' +
        '<span class="cat"></span>' +
        '<p class="title"></p>' +
        '<span class="rating"></span>' +
        '<span class="price"></span>' +
        "</div>";

      var img = card.querySelector("img");
      img.src = p.image;
      img.alt = p.title;
      card.querySelector(".cat").textContent = labelCategoria(p.category);
      card.querySelector(".title").textContent = p.title;
      card.querySelector(".rating").textContent =
        "★ " + (p.rating ? p.rating.rate.toFixed(1) : "–") + " (" + (p.rating ? p.rating.count : 0) + ")";
      card.querySelector(".price").textContent = "$" + p.price.toFixed(2);

      grid.appendChild(card);
    });

    elConteudo.innerHTML = "";
    elConteudo.appendChild(grid);
  }

  function renderPills(categorias) {
    var todas = [{ valor: TODAS, label: "Todas" }].concat(
      categorias.map(function (c) { return { valor: c, label: labelCategoria(c) }; })
    );
    elPills.innerHTML = "";
    todas.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill" + (item.valor === categoriaAtiva ? " active" : "");
      btn.textContent = item.label;
      btn.dataset.categoria = item.valor;
      elPills.appendChild(btn);
    });
  }

  function marcarPillAtiva() {
    elPills.querySelectorAll(".pill").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.categoria === categoriaAtiva);
    });
  }

  function carregarCategoria(categoria) {
    categoriaAtiva = categoria;
    marcarPillAtiva();

    if (cache.produtos[categoria]) {
      renderProdutos(cache.produtos[categoria]);
      return;
    }

    renderSkeleton();
    var promessa = categoria === TODAS ? App.api.getProducts() : App.api.getProductsByCategory(categoria);
    promessa
      .then(function (produtos) {
        cache.produtos[categoria] = produtos;
        if (categoriaAtiva === categoria) renderProdutos(produtos);
      })
      .catch(function (err) {
        renderErro(err.message, function () { carregarCategoria(categoria); });
      });
  }

  function carregarCategorias() {
    if (cache.categorias) {
      renderPills(cache.categorias);
      return;
    }
    App.api.getCategories()
      .then(function (categorias) {
        cache.categorias = categorias;
        renderPills(categorias);
      })
      .catch(function () {
        elPills.innerHTML = "";
      });
  }

  function ativar() {
    if (carregado) return;
    carregado = true;
    carregarCategorias();
    carregarCategoria(TODAS);
  }

  function init() {
    elPills = document.getElementById("catalogo-pills");
    elConteudo = document.getElementById("catalogo-conteudo");

    elPills.addEventListener("click", function (e) {
      if (e.target.matches(".pill")) carregarCategoria(e.target.dataset.categoria);
    });
  }

  App.catalogo = { init: init, ativar: ativar };
})();
