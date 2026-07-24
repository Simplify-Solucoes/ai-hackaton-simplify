/* =========================================================================
   Mini-CRM Lite — dashboard de 2 telas (clientes + catálogo de produtos)
   HTML/CSS/JS puro, sem dependências.
   ========================================================================= */

(() => {
  "use strict";

  // --- Constantes ----------------------------------------------------------

  const STATUS = ["ativo", "pendente", "inadimplente"];
  const PLANOS = ["Básico", "Pro", "Enterprise"];
  const rotulo = { ativo: "Ativo", pendente: "Pendente", inadimplente: "Inadimplente" };

  const CHAVE_CLIENTES = "minicrm.clientes.v1";
  const CHAVE_PRODUTOS = "minicrm.produtos.cache.v1";
  const CHAVE_SESSAO   = "minicrm.sessao.v1";

  const API_BASE     = "https://fakestoreapi.com";
  const API_PRODUTOS = `${API_BASE}/products`;
  const API_LOGIN    = `${API_BASE}/auth/login`;
  const API_USERS    = `${API_BASE}/users`;

  const TIMEOUT_MS = 10000;
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
  const SESSAO_TTL_MS = 8 * 60 * 60 * 1000; // 8h

  const ROTAS = ["/clientes", "/produtos"];
  const ROTA_PADRAO = "/clientes";

  const moedaUSD = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
  const numero = new Intl.NumberFormat("pt-BR");

  const $ = (id) => document.getElementById(id);

  // =========================================================================
  // Storage
  // =========================================================================

  function lerStorage(chave) {
    try {
      return localStorage.getItem(chave);
    } catch (error) {
      // Storage bloqueado (modo privado, cookies desabilitados): segue em memória.
      console.error(`Erro ao ler "${chave}" do localStorage:`, error);
      return null;
    }
  }

  function gravarStorage(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.error(`Erro ao gravar "${chave}" no localStorage:`, error);
      return false;
    }
  }

  function removerStorage(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (error) {
      console.error(`Erro ao remover "${chave}" do localStorage:`, error);
    }
  }

  // =========================================================================
  // Sessão
  //
  // ATENÇÃO — isto é um GATE DE INTERFACE, não controle de acesso.
  //
  // A fakestoreapi valida a credencial (401 com senha errada) e devolve um JWT,
  // mas nenhum endpoint dela verifica esse token: /products e /users respondem
  // igual com ou sem ele. Além disso, GET /users expõe todas as senhas em texto
  // puro, sem autenticação.
  //
  // Como a decisão de "está logado?" acontece no navegador, qualquer pessoa
  // contorna escrevendo no localStorage pelo DevTools. Isso serve para o fluxo
  // da demo. Autenticação real exige o servidor validando o token a cada
  // requisição e nunca confiando no cliente.
  // =========================================================================

  let sessao = null;

  function normalizarSessao(bruto) {
    if (!bruto || typeof bruto !== "object") return null;

    const token = typeof bruto.token === "string" ? bruto.token.trim() : "";
    const usuario = typeof bruto.usuario === "string" ? bruto.usuario.trim() : "";
    const criadaEm = Number(bruto.criadaEm);

    if (token === "" || usuario === "" || !Number.isFinite(criadaEm)) return null;
    if (Date.now() - criadaEm > SESSAO_TTL_MS) return null; // expirada

    return {
      token,
      usuario,
      nome: typeof bruto.nome === "string" && bruto.nome.trim() !== ""
        ? bruto.nome.trim()
        : usuario,
      criadaEm,
    };
  }

  function carregarSessao() {
    const bruto = lerStorage(CHAVE_SESSAO);
    if (bruto === null) return null;

    try {
      return normalizarSessao(JSON.parse(bruto));
    } catch (error) {
      console.error("Erro ao interpretar a sessão salva:", error);
      return null;
    }
  }

  // Busca o nome de exibição do usuário. É enfeite: se falhar, o login segue.
  // Guardamos apenas nome — a senha que /users devolve nunca é persistida.
  async function buscarNomeExibicao(username) {
    try {
      const resposta = await fetch(API_USERS);
      if (!resposta.ok) return null;

      const usuarios = await resposta.json();
      if (!Array.isArray(usuarios)) return null;

      const achado = usuarios.find((u) => u && u.username === username);
      const nome = achado && achado.name && typeof achado.name === "object"
        ? [achado.name.firstname, achado.name.lastname].filter(Boolean).join(" ").trim()
        : "";

      return nome !== "" ? nome : null;
    } catch (error) {
      console.error("Não foi possível obter o nome do usuário:", error);
      return null;
    }
  }

  async function entrar(usuario, senha) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resposta = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usuario, password: senha }),
        signal: controller.signal,
      });

      if (resposta.status === 401) {
        throw new Error("Usuário ou senha incorretos.");
      }
      if (!resposta.ok) {
        throw new Error(`A API respondeu ${resposta.status}. Tente novamente.`);
      }

      const dados = await resposta.json();
      const token = dados && typeof dados.token === "string" ? dados.token.trim() : "";
      if (token === "") throw new Error("A API não devolveu um token válido.");

      const nome = await buscarNomeExibicao(usuario);

      sessao = { token, usuario, nome: nome || usuario, criadaEm: Date.now() };
      gravarStorage(CHAVE_SESSAO, sessao);

      return { ok: true };
    } catch (error) {
      if (error.name === "AbortError") {
        return { ok: false, mensagem: `Tempo esgotado (${TIMEOUT_MS / 1000}s). Verifique sua conexão.` };
      }
      // TypeError aqui é quase sempre rede/CORS, não credencial inválida.
      if (error instanceof TypeError) {
        return { ok: false, mensagem: "Falha de conexão com a API. Verifique sua rede." };
      }
      return { ok: false, mensagem: error.message };
    } finally {
      clearTimeout(timer);
    }
  }

  function sair() {
    const quem = sessao ? sessao.nome : "usuário";
    sessao = null;
    removerStorage(CHAVE_SESSAO);

    // O catálogo é recarregado no próximo login, para não vazar estado entre sessões.
    produtos.itens = [];
    produtos.erro = null;
    produtos.origem = null;
    produtos.salvoEm = null;

    aplicarSessao();
    registrarLog(`Sessão encerrada: ${quem}`);
  }

  function aplicarSessao() {
    const autenticado = sessao !== null;

    $("tela-login").hidden = autenticado;
    $("app").hidden = !autenticado;

    if (autenticado) {
      $("sessao-usuario").textContent = sessao.nome;
      navegar();
    } else {
      document.title = "Entrar — Mini-CRM Lite";
      $("form-login").reset();
      $("login-erro").hidden = true;
      $("login-usuario").focus();
    }
  }

  // =========================================================================
  // Clientes
  // =========================================================================

  // Cada cliente precisa do SEU próprio objeto de status.
  // Compartilhar uma única referência faz a alteração de um cliente vazar para todos.
  const criarStatusPadrao = () => ({ valor: "ativo", atualizadoEm: null });

  const clientesIniciais = () => [
    { id: 1, nome: "Ana Souza",   plano: "Pro",        status: criarStatusPadrao() },
    { id: 2, nome: "Bruno Lima",  plano: "Básico",     status: criarStatusPadrao() },
    { id: 3, nome: "Carla Dias",  plano: "Enterprise", status: criarStatusPadrao() },
  ];

  // Dados vindos do storage são entrada não confiável: podem ter sido editados
  // à mão, salvos por uma versão antiga do app ou corrompidos. Normalizamos tudo.
  function normalizarCliente(bruto) {
    if (!bruto || typeof bruto !== "object") return null;

    const id = Number(bruto.id);
    const nome = typeof bruto.nome === "string" ? bruto.nome.trim() : "";
    if (!Number.isFinite(id) || nome === "") return null;

    const status = bruto.status && typeof bruto.status === "object" ? bruto.status : {};

    return {
      id,
      nome,
      plano: PLANOS.includes(bruto.plano) ? bruto.plano : "Básico",
      status: {
        valor: STATUS.includes(status.valor) ? status.valor : "ativo",
        atualizadoEm: typeof status.atualizadoEm === "string" ? status.atualizadoEm : null,
      },
    };
  }

  function deduplicarPorId(lista) {
    const vistos = new Set();
    return lista.filter((item) => {
      if (vistos.has(item.id)) return false;
      vistos.add(item.id);
      return true;
    });
  }

  function carregarClientes() {
    const bruto = lerStorage(CHAVE_CLIENTES);
    if (bruto === null) return clientesIniciais();

    try {
      const dados = JSON.parse(bruto);
      if (!Array.isArray(dados)) throw new Error("formato inválido: esperado um array");
      return deduplicarPorId(dados.map(normalizarCliente).filter(Boolean));
    } catch (error) {
      console.error("Erro ao interpretar clientes salvos:", error);
      return clientesIniciais();
    }
  }

  function salvarClientes() {
    if (!gravarStorage(CHAVE_CLIENTES, clientes)) {
      registrarLog("Não foi possível salvar — alterações valem só nesta aba.", true);
    }
  }

  function proximoIdCliente() {
    return clientes.reduce((maior, c) => Math.max(maior, c.id), 0) + 1;
  }

  let clientes = carregarClientes();

  // =========================================================================
  // Produtos (fakestoreapi.com)
  // =========================================================================

  const produtos = {
    itens: [],
    carregando: false,
    erro: null,
    origem: null,     // "api" | "cache"
    salvoEm: null,    // timestamp do cache
  };

  const filtros = { busca: "", categoria: "", ordem: "nome" };

  // A API é um serviço externo: o payload pode mudar de forma sem aviso.
  // Validamos campo a campo e descartamos o que não serve, em vez de confiar.
  function normalizarProduto(bruto) {
    if (!bruto || typeof bruto !== "object") return null;

    const id = Number(bruto.id);
    const titulo = typeof bruto.title === "string" ? bruto.title.trim() : "";
    const preco = Number(bruto.price);

    if (!Number.isFinite(id) || titulo === "" || !Number.isFinite(preco) || preco < 0) {
      return null;
    }

    const avaliacao = bruto.rating && typeof bruto.rating === "object" ? bruto.rating : {};
    const nota = Number(avaliacao.rate);
    const votos = Number(avaliacao.count);

    return {
      id,
      titulo,
      preco,
      categoria: typeof bruto.category === "string" && bruto.category.trim() !== ""
        ? bruto.category.trim()
        : "sem categoria",
      // Só aceitamos http(s): a URL vai para <img src>, e javascript:/data:
      // vindos de terceiros não têm por que ser renderizados.
      imagem: urlSegura(bruto.image),
      nota: Number.isFinite(nota) ? nota : null,
      votos: Number.isFinite(votos) ? votos : 0,
    };
  }

  function urlSegura(valor) {
    if (typeof valor !== "string") return null;
    try {
      const url = new URL(valor, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  }

  function lerCacheProdutos() {
    const bruto = lerStorage(CHAVE_PRODUTOS);
    if (bruto === null) return null;

    try {
      const cache = JSON.parse(bruto);
      if (!cache || !Array.isArray(cache.dados)) return null;

      const itens = deduplicarPorId(cache.dados.map(normalizarProduto).filter(Boolean));
      if (itens.length === 0) return null;

      return { itens, salvoEm: Number(cache.salvoEm) || 0 };
    } catch (error) {
      console.error("Erro ao interpretar cache de produtos:", error);
      return null;
    }
  }

  async function buscarProdutos({ forcar = false } = {}) {
    const cache = lerCacheProdutos();
    const fresco = cache && Date.now() - cache.salvoEm < CACHE_TTL_MS;

    if (!forcar && fresco) {
      produtos.itens = cache.itens;
      produtos.origem = "cache";
      produtos.salvoEm = cache.salvoEm;
      produtos.erro = null;
      registrarLog(`Catálogo carregado do cache (${cache.itens.length} produtos).`);
      renderProdutos();
      return;
    }

    produtos.carregando = true;
    produtos.erro = null;
    renderProdutos();

    // Sem timeout, uma rede ruim deixa o skeleton girando para sempre.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resposta = await fetch(API_PRODUTOS, { signal: controller.signal });
      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status} ${resposta.statusText}`.trim());
      }

      const dados = await resposta.json();
      if (!Array.isArray(dados)) throw new Error("resposta inesperada: esperado um array");

      const itens = deduplicarPorId(dados.map(normalizarProduto).filter(Boolean));
      if (itens.length === 0) throw new Error("nenhum produto válido na resposta");

      const descartados = dados.length - itens.length;

      produtos.itens = itens;
      produtos.origem = "api";
      produtos.salvoEm = Date.now();
      gravarStorage(CHAVE_PRODUTOS, { salvoEm: produtos.salvoEm, dados });

      registrarLog(
        `Catálogo atualizado da API: ${itens.length} produtos.` +
        (descartados > 0 ? ` ${descartados} registro(s) inválido(s) descartado(s).` : "")
      );
    } catch (error) {
      const motivo = error.name === "AbortError"
        ? `tempo esgotado (${TIMEOUT_MS / 1000}s)`
        : error.message;

      console.error("Falha ao buscar produtos:", error);

      // Cache velho ainda é melhor que tela de erro: mostramos com aviso.
      if (cache) {
        produtos.itens = cache.itens;
        produtos.origem = "cache";
        produtos.salvoEm = cache.salvoEm;
        produtos.erro = null;
        registrarLog(`API indisponível (${motivo}). Exibindo cache local.`, true);
      } else {
        produtos.itens = [];
        produtos.erro = motivo;
        registrarLog(`Falha ao carregar o catálogo: ${motivo}`, true);
      }
    } finally {
      clearTimeout(timer);
      produtos.carregando = false;
      renderProdutos();
    }
  }

  function produtosFiltrados() {
    const busca = filtros.busca.trim().toLowerCase();

    const lista = produtos.itens.filter((p) => {
      const casaBusca = busca === "" || p.titulo.toLowerCase().includes(busca);
      const casaCategoria = filtros.categoria === "" || p.categoria === filtros.categoria;
      return casaBusca && casaCategoria;
    });

    const ordenadores = {
      "nome":       (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"),
      "preco-asc":  (a, b) => a.preco - b.preco,
      "preco-desc": (a, b) => b.preco - a.preco,
      "avaliacao":  (a, b) => (b.nota ?? 0) - (a.nota ?? 0),
    };

    return lista.sort(ordenadores[filtros.ordem] || ordenadores.nome);
  }

  // =========================================================================
  // Render — helpers
  // =========================================================================

  // Tudo é montado com textContent/DOM em vez de innerHTML: nomes vêm de input
  // do usuário e o catálogo vem de uma API de terceiros. Interpolar HTML aqui
  // seria XSS direto.
  function el(tag, classe, texto) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto !== undefined) node.textContent = texto;
    return node;
  }

  function celula(conteudo, classe) {
    const td = document.createElement("td");
    if (classe) td.className = classe;
    if (conteudo) td.appendChild(conteudo);
    return td;
  }

  function statCard(rotuloTexto, valor, variante) {
    const card = el("div", "stat");
    card.append(
      el("span", "stat-rotulo", rotuloTexto),
      el("span", "stat-valor" + (variante ? " " + variante : ""), valor),
    );
    return card;
  }

  // =========================================================================
  // Render — clientes
  // =========================================================================

  function montarBadgeStatus(status) {
    const badge = el("span", "badge " + status.valor);

    const ponto = el("span", "ponto");
    ponto.setAttribute("aria-hidden", "true");

    badge.append(ponto, document.createTextNode(rotulo[status.valor]));
    if (status.atualizadoEm) badge.title = "Atualizado às " + status.atualizadoEm;

    return badge;
  }

  function montarSelectStatus(cliente) {
    const select = el("select");
    select.dataset.id = String(cliente.id);
    select.setAttribute("aria-label", "Alterar status de " + cliente.nome);

    for (const s of STATUS) {
      const option = el("option", null, rotulo[s]);
      option.value = s;
      option.selected = s === cliente.status.valor;
      select.appendChild(option);
    }
    return select;
  }

  function renderStatsClientes() {
    const alvo = $("stats-clientes");
    alvo.textContent = "";

    const contar = (valor) => clientes.filter((c) => c.status.valor === valor).length;
    const inadimplentes = contar("inadimplente");

    alvo.append(
      statCard("Total de clientes", numero.format(clientes.length)),
      statCard("Ativos", numero.format(contar("ativo"))),
      statCard("Pendentes", numero.format(contar("pendente"))),
      statCard("Inadimplentes", numero.format(inadimplentes), inadimplentes > 0 ? "risco" : null),
    );
  }

  function renderClientes() {
    const tbody = $("tbody-clientes");
    tbody.textContent = "";

    if (clientes.length === 0) {
      const tr = el("tr");
      const td = el("td", "tabela-vazia", "Nenhum cliente cadastrado.");
      td.colSpan = 5;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      for (const c of clientes) {
        const tr = el("tr");

        const excluir = el("button", "excluir", "Excluir");
        excluir.type = "button";
        excluir.dataset.excluirId = String(c.id);
        excluir.setAttribute("aria-label", "Excluir " + c.nome);

        tr.append(
          celula(el("span", "nome", c.nome)),
          celula(document.createTextNode(c.plano), "plano"),
          celula(montarBadgeStatus(c.status)),
          celula(montarSelectStatus(c)),
          celula(excluir, "acoes"),
        );
        tbody.appendChild(tr);
      }
    }

    renderStatsClientes();
  }

  // =========================================================================
  // Render — produtos
  // =========================================================================

  function renderStatsProdutos() {
    const alvo = $("stats-produtos");
    alvo.textContent = "";

    if (produtos.itens.length === 0) return;

    const precos = produtos.itens.map((p) => p.preco);
    const medio = precos.reduce((soma, p) => soma + p, 0) / precos.length;
    const categorias = new Set(produtos.itens.map((p) => p.categoria));
    const melhor = produtos.itens.reduce(
      (topo, p) => ((p.nota ?? 0) > (topo?.nota ?? 0) ? p : topo),
      null
    );

    alvo.append(
      statCard("Produtos", numero.format(produtos.itens.length)),
      statCard("Categorias", numero.format(categorias.size)),
      statCard("Preço médio", moedaUSD.format(medio), "destaque"),
      statCard("Melhor avaliação", melhor?.nota != null ? melhor.nota.toFixed(1) : "—"),
    );
  }

  function montarCardProduto(p) {
    const card = el("article", "produto");

    const moldura = el("div", "produto-imagem");
    if (p.imagem) {
      const img = el("img");
      img.src = p.imagem;
      img.alt = p.titulo;
      img.loading = "lazy";
      // Imagem externa pode 404: trocamos por um placeholder em vez de ícone quebrado.
      img.addEventListener("error", () => {
        moldura.textContent = "";
        moldura.appendChild(el("span", "sem-imagem", "Imagem indisponível"));
      });
      moldura.appendChild(img);
    } else {
      moldura.appendChild(el("span", "sem-imagem", "Sem imagem"));
    }

    const corpo = el("div", "produto-corpo");

    const titulo = el("h3", "produto-titulo", p.titulo);
    titulo.title = p.titulo;

    const rodape = el("div", "produto-rodape");
    rodape.append(
      el("span", "produto-preco", moedaUSD.format(p.preco)),
      el("span", "produto-avaliacao",
        p.nota != null ? `${p.nota.toFixed(1)} (${numero.format(p.votos)})` : "Sem avaliações"),
    );

    corpo.append(el("span", "badge categoria", p.categoria), titulo, rodape);
    card.append(moldura, corpo);
    return card;
  }

  function montarSkeleton() {
    const grade = el("div", "grade");
    for (let i = 0; i < 8; i++) {
      const card = el("div", "skeleton");
      const imagem = el("div", "sk-imagem skeleton-bloco");
      const corpo = el("div", "sk-corpo");
      corpo.append(
        el("div", "sk-linha skeleton-bloco curta"),
        el("div", "sk-linha skeleton-bloco"),
        el("div", "sk-linha skeleton-bloco curta"),
      );
      card.append(imagem, corpo);
      grade.appendChild(card);
    }
    return grade;
  }

  function montarEstadoErro(motivo) {
    const box = el("div", "estado");
    box.append(
      el("h3", null, "Não foi possível carregar o catálogo"),
      el("p", null, "A API de produtos não respondeu e não há cache local disponível."),
      el("p", "detalhe", motivo),
    );

    const tentar = el("button", null, "Tentar novamente");
    tentar.type = "button";
    tentar.addEventListener("click", () => buscarProdutos({ forcar: true }));
    box.appendChild(tentar);

    return box;
  }

  function atualizarFiltroCategorias() {
    const select = $("produto-filtro-categoria");
    const atual = filtros.categoria;

    const categorias = [...new Set(produtos.itens.map((p) => p.categoria))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    select.textContent = "";
    const todas = el("option", null, "Todas as categorias");
    todas.value = "";
    select.appendChild(todas);

    for (const c of categorias) {
      const option = el("option", null, c);
      option.value = c;
      select.appendChild(option);
    }

    // Uma categoria que sumiu do catálogo não pode continuar filtrando.
    select.value = categorias.includes(atual) ? atual : "";
    filtros.categoria = select.value;
  }

  function renderProdutos() {
    const alvo = $("produtos-conteudo");
    const contador = $("produto-contador");
    const recarregar = $("btn-recarregar");

    alvo.textContent = "";
    recarregar.disabled = produtos.carregando;

    if (produtos.carregando) {
      contador.textContent = "Carregando…";
      alvo.appendChild(montarSkeleton());
      return;
    }

    if (produtos.erro) {
      contador.textContent = "";
      $("stats-produtos").textContent = "";
      alvo.appendChild(montarEstadoErro(produtos.erro));
      return;
    }

    atualizarFiltroCategorias();
    renderStatsProdutos();

    if (produtos.origem === "cache" && produtos.salvoEm) {
      const quando = new Date(produtos.salvoEm).toLocaleString("pt-BR");
      alvo.appendChild(el("div", "aviso-cache", `Exibindo cache local de ${quando}.`));
    }

    const lista = produtosFiltrados();
    contador.textContent = lista.length === produtos.itens.length
      ? `${numero.format(lista.length)} produtos`
      : `${numero.format(lista.length)} de ${numero.format(produtos.itens.length)} produtos`;

    if (lista.length === 0) {
      const vazio = el("div", "estado");
      vazio.append(
        el("h3", null, "Nenhum produto encontrado"),
        el("p", null, "Ajuste a busca ou o filtro de categoria."),
      );
      alvo.appendChild(vazio);
      return;
    }

    const grade = el("div", "grade");
    for (const p of lista) grade.appendChild(montarCardProduto(p));
    alvo.appendChild(grade);
  }

  // =========================================================================
  // Ações — clientes
  // =========================================================================

  function mudarStatus(id, novoValor) {
    const cliente = clientes.find((c) => c.id === id);
    if (!cliente) {
      registrarLog(`Cliente ${id} não encontrado — status não alterado.`, true);
      return;
    }

    cliente.status.valor = novoValor;
    cliente.status.atualizadoEm = new Date().toLocaleTimeString("pt-BR");

    if (novoValor === "inadimplente") {
      registrarLog(
        `Ação disparada: ${cliente.nome} ficou inadimplente (${cliente.status.atualizadoEm})`,
        true
      );
    } else {
      registrarLog(`${cliente.nome} → ${rotulo[novoValor]} (${cliente.status.atualizadoEm})`);
    }

    salvarClientes();
    renderClientes();
  }

  function adicionarCliente(nome, plano) {
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");

    if (nomeLimpo === "") {
      registrarLog("Informe o nome do cliente para adicionar.", true);
      return false;
    }

    if (clientes.some((c) => c.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      registrarLog(`Já existe um cliente chamado "${nomeLimpo}".`, true);
      return false;
    }

    clientes.push({
      id: proximoIdCliente(),
      nome: nomeLimpo,
      plano: PLANOS.includes(plano) ? plano : "Básico",
      status: criarStatusPadrao(),
    });

    registrarLog(`Cliente adicionado: ${nomeLimpo} (${plano})`);
    salvarClientes();
    renderClientes();
    return true;
  }

  function excluirCliente(id) {
    const indice = clientes.findIndex((c) => c.id === id);
    if (indice === -1) {
      registrarLog(`Cliente ${id} não encontrado — nada foi excluído.`, true);
      return;
    }

    const [removido] = clientes.splice(indice, 1);
    registrarLog(`Cliente excluído: ${removido.nome}`);
    salvarClientes();
    renderClientes();
  }

  // =========================================================================
  // Log
  // =========================================================================

  function registrarLog(texto, alerta = false) {
    const box = $("log");
    const vazio = box.querySelector(".vazio");
    if (vazio) vazio.remove();

    const linha = el("div", "linha" + (alerta ? " alerta" : ""), texto);
    box.prepend(linha);
  }

  // =========================================================================
  // Router (hash)
  // =========================================================================

  function rotaAtual() {
    const hash = window.location.hash.replace(/^#/, "");
    return ROTAS.includes(hash) ? hash : ROTA_PADRAO;
  }

  function navegar() {
    const rota = rotaAtual();

    $("tela-clientes").hidden = rota !== "/clientes";
    $("tela-produtos").hidden = rota !== "/produtos";

    for (const item of document.querySelectorAll(".nav-item")) {
      if (item.dataset.rota === rota) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    }

    document.title = rota === "/produtos"
      ? "Produtos — Mini-CRM Lite"
      : "Clientes — Mini-CRM Lite";

    // O catálogo só é buscado quando a tela é aberta pela primeira vez.
    if (rota === "/produtos" && produtos.itens.length === 0 && !produtos.carregando && !produtos.erro) {
      buscarProdutos();
    }
  }

  // =========================================================================
  // Eventos
  // =========================================================================

  const tbody = $("tbody-clientes");

  tbody.addEventListener("change", (e) => {
    if (e.target.matches("select[data-id]")) {
      mudarStatus(Number(e.target.dataset.id), e.target.value);
    }
  });

  tbody.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-excluir-id]");
    if (!botao) return;

    const id = Number(botao.dataset.excluirId);
    const cliente = clientes.find((c) => c.id === id);
    if (!cliente) return;

    if (confirm(`Excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) {
      excluirCliente(id);
    }
  });

  const formCliente = $("form-cliente");
  const inputNome = $("input-nome");
  const inputPlano = $("input-plano");

  formCliente.addEventListener("submit", (e) => {
    e.preventDefault();
    if (adicionarCliente(inputNome.value, inputPlano.value)) formCliente.reset();
    inputNome.focus();
  });

  $("btn-importar").addEventListener("click", () => {
    registrarLog("TODO: integrar com https://fakestoreapi.com/users");
    alert("Integração pendente — este é um dos desafios! Veja o TODO em app.js.");
  });

  // Filtros do catálogo: só re-renderizam, nunca refazem a requisição.
  $("produto-busca").addEventListener("input", (e) => {
    filtros.busca = e.target.value;
    renderProdutos();
  });

  $("produto-filtro-categoria").addEventListener("change", (e) => {
    filtros.categoria = e.target.value;
    renderProdutos();
  });

  $("produto-ordem").addEventListener("change", (e) => {
    filtros.ordem = e.target.value;
    renderProdutos();
  });

  $("btn-recarregar").addEventListener("click", () => buscarProdutos({ forcar: true }));

  // --- Login ---------------------------------------------------------------

  const formLogin = $("form-login");
  const loginErro = $("login-erro");
  const btnEntrar = $("btn-entrar");

  function mostrarErroLogin(mensagem) {
    loginErro.textContent = mensagem;
    loginErro.hidden = false;
  }

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = $("login-usuario").value.trim();
    const senha = $("login-senha").value;

    loginErro.hidden = true;

    if (usuario === "" || senha === "") {
      mostrarErroLogin("Preencha usuário e senha.");
      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando…";

    try {
      const resultado = await entrar(usuario, senha);

      if (!resultado.ok) {
        mostrarErroLogin(resultado.mensagem);
        $("login-senha").value = "";
        $("login-senha").focus();
        return;
      }

      aplicarSessao();
      registrarLog(`Sessão iniciada: ${sessao.nome} (${sessao.usuario})`);
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.textContent = "Entrar";
    }
  });

  $("btn-sair").addEventListener("click", () => {
    if (confirm("Encerrar a sessão?")) sair();
  });

  // Mantém as abas abertas em sincronia — o storage é compartilhado entre elas.
  window.addEventListener("storage", (e) => {
    if (e.key === CHAVE_CLIENTES) {
      clientes = carregarClientes();
      renderClientes();
      registrarLog("Lista de clientes recarregada (alterada em outra aba).");
      return;
    }

    // Sair numa aba deve derrubar as demais.
    if (e.key === CHAVE_SESSAO) {
      sessao = carregarSessao();
      aplicarSessao();
    }
  });

  window.addEventListener("hashchange", () => {
    if (sessao) navegar();
  });

  // =========================================================================
  // Boot
  // =========================================================================

  $("log").appendChild(el("span", "vazio", "Nenhuma ação ainda."));
  renderClientes();

  sessao = carregarSessao();
  aplicarSessao();
})();
