# Mini-CRM Lite

Mini-CRM com cadastro de clientes, catálogo de produtos, dashboard com indicadores e login — persistência em arquivos `.txt` (sem banco de dados).

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm (instalado junto com o Node.js)

## Instalação

```bash
npm install
```

## Como rodar

```bash
npm start
```

Por padrão o servidor sobe em `http://localhost:3000`. Para usar outra porta:

```bash
PORT=3001 npm start
```

## Acesso

Abra `http://localhost:3000` (ou a porta escolhida) no navegador. Você será redirecionado para a tela de login.

**Usuário padrão:**

| Usuário | Senha      |
| ------- | ---------- |
| admin   | admin123   |

Esse usuário é criado automaticamente na primeira execução (veja [Persistência de dados](#persistência-de-dados)).

## Funcionalidades

- **Login** — autenticação por usuário/senha, com sessão via token (`Authorization: Bearer`).
- **Dashboard** — indicadores de clientes, inadimplência, produtos e valor total em estoque, além de gráfico de status e lista de produtos com estoque baixo.
- **Clientes** — listagem, cadastro, edição, exclusão e alteração de status (ativo, pendente, inadimplente).
- **Produtos** — listagem, cadastro, edição e exclusão do catálogo (nome, categoria, preço, estoque).

## Persistência de dados

Os dados são armazenados como JSON em arquivos de texto na pasta `data/` (criada automaticamente, ignorada pelo git):

- `data/clientes.txt`
- `data/produtos.txt`
- `data/usuarios.txt`

Se a pasta `data/` não existir ou estiver vazia, o servidor popula os arquivos com dados de exemplo (3 clientes, 3 produtos e o usuário `admin`) ao iniciar. Para reiniciar a aplicação do zero, basta apagar os arquivos `.txt` dentro de `data/` e reiniciar o servidor.

## Estrutura do projeto

```
server.js            # servidor Express e rotas da API (/api/clientes, /api/produtos, /api/login)
lib/
  store.js           # leitura/escrita dos arquivos .txt
  auth.js            # hash e verificação de senha (scrypt)
  seed.js            # dados iniciais (clientes, produtos, usuário admin)
public/
  login.html         # tela de login
  index.html         # dashboard
  clientes.html       # CRUD de clientes
  produtos.html       # CRUD de produtos
  shared.js           # helpers de front-end (fetch autenticado, navbar, toasts)
  style.css           # estilos complementares ao Bootstrap
data/                 # arquivos .txt gerados em tempo de execução (não versionados)
```

## Stack

- **Back-end:** Node.js + Express
- **Front-end:** HTML, CSS, Bootstrap 5 e JavaScript puro
- **Persistência:** arquivos `.txt` (JSON serializado), sem banco de dados
