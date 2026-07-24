const express = require("express");
const path = require("path");
const crypto = require("crypto");

const store = require("./lib/store");
const { verifyPassword } = require("./lib/auth");
const { seed } = require("./lib/seed");

seed();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Sessões em memória (token -> usuario) ----
const sessions = new Map();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  req.usuario = sessions.get(token);
  next();
}

// ---- Autenticação ----
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body || {};
  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Informe usuário e senha" });
  }

  const usuarios = store.read("usuarios");
  const registro = usuarios.find((u) => u.usuario === usuario);
  if (!registro || !verifyPassword(senha, registro.salt, registro.hash)) {
    return res.status(401).json({ erro: "Usuário ou senha inválidos" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, registro.usuario);
  res.json({ token, usuario: registro.usuario });
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization.slice(7);
  sessions.delete(token);
  res.json({ ok: true });
});

// ---- Clientes ----
app.get("/api/clientes", requireAuth, (req, res) => {
  res.json(store.read("clientes"));
});

app.post("/api/clientes", requireAuth, (req, res) => {
  const { nome, plano } = req.body || {};
  if (!nome || !plano) {
    return res.status(400).json({ erro: "Nome e plano são obrigatórios" });
  }

  const clientes = store.read("clientes");
  const novo = {
    id: store.nextId(clientes),
    nome,
    plano,
    status: { valor: "ativo", atualizadoEm: new Date().toLocaleString("pt-BR") },
  };
  clientes.push(novo);
  store.write("clientes", clientes);
  res.status(201).json(novo);
});

app.put("/api/clientes/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const clientes = store.read("clientes");
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });

  const { nome, plano, statusValor } = req.body || {};
  if (nome) cliente.nome = nome;
  if (plano) cliente.plano = plano;
  if (statusValor) {
    cliente.status = {
      valor: statusValor,
      atualizadoEm: new Date().toLocaleString("pt-BR"),
    };
  }

  store.write("clientes", clientes);
  res.json(cliente);
});

app.delete("/api/clientes/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const clientes = store.read("clientes");
  if (!clientes.some((c) => c.id === id)) {
    return res.status(404).json({ erro: "Cliente não encontrado" });
  }
  store.write(
    "clientes",
    clientes.filter((c) => c.id !== id),
  );
  res.status(204).end();
});

// ---- Produtos ----
app.get("/api/produtos", requireAuth, (req, res) => {
  res.json(store.read("produtos"));
});

app.post("/api/produtos", requireAuth, (req, res) => {
  const { nome, categoria, preco, estoque } = req.body || {};
  if (!nome || !categoria || preco == null || estoque == null) {
    return res
      .status(400)
      .json({ erro: "Nome, categoria, preço e estoque são obrigatórios" });
  }

  const produtos = store.read("produtos");
  const novo = {
    id: store.nextId(produtos),
    nome,
    categoria,
    preco: Number(preco),
    estoque: Number(estoque),
  };
  produtos.push(novo);
  store.write("produtos", produtos);
  res.status(201).json(novo);
});

app.put("/api/produtos/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const produtos = store.read("produtos");
  const produto = produtos.find((p) => p.id === id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  const { nome, categoria, preco, estoque } = req.body || {};
  if (nome) produto.nome = nome;
  if (categoria) produto.categoria = categoria;
  if (preco != null) produto.preco = Number(preco);
  if (estoque != null) produto.estoque = Number(estoque);

  store.write("produtos", produtos);
  res.json(produto);
});

app.delete("/api/produtos/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const produtos = store.read("produtos");
  if (!produtos.some((p) => p.id === id)) {
    return res.status(404).json({ erro: "Produto não encontrado" });
  }
  store.write(
    "produtos",
    produtos.filter((p) => p.id !== id),
  );
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Mini-CRM Lite rodando em http://localhost:${PORT}`);
});
