const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function filePath(nome) {
  return path.join(DATA_DIR, `${nome}.txt`);
}

function read(nome) {
  const caminho = filePath(nome);
  if (!fs.existsSync(caminho)) return [];
  const conteudo = fs.readFileSync(caminho, "utf-8").trim();
  return conteudo ? JSON.parse(conteudo) : [];
}

function write(nome, dados) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(nome), JSON.stringify(dados, null, 2), "utf-8");
}

function nextId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

module.exports = { read, write, nextId };
