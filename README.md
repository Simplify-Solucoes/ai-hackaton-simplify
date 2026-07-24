# Esdras CRM · Simplify Hackathon

CRM empresarial single-file (HTML/CSS/JS puro) construído a partir do starter do hackathon.
Sem build, sem dependências — abra o `index.html` ou faça deploy estático.

## ✅ Desafios entregues

| # | Desafio | Onde |
|---|---------|------|
| 1 | **Catálogo de produtos** via `fakestoreapi.com/products` | Aba **Catálogo** — grid com imagem, preço, avaliação, busca, filtro por categoria e ordenação |
| 2 | **Correção do bug** | `novoStatus()` — cada cliente tem seu próprio objeto de status (o starter compartilhava a mesma referência entre todos) |
| 3 | **Adicionar e excluir clientes** | Aba **Clientes** — modal "Novo cliente" + botão de exclusão por linha |
| 4 | **Persistência** | `localStorage` (`esdrascrm.clientes`) — sobrevive a reload |
| 5 | **Visual profissional** | Sidebar + topbar, cards, badges de status, toasts, **dark mode**, responsivo |
| 6 | **Dashboard interativo** | Aba **Dashboard** — KPIs (MRR, ticket médio…), gráficos clicáveis, alternância de métrica |
| 7 | **Login** via `fakestoreapi.com/auth/login` | Tela de login que protege a aplicação, com token em `localStorage` |

## 🐛 A correção do bug (causa raiz)

No starter, os clientes compartilhavam **o mesmo objeto** de status:

```js
const statusPadrao = { valor: "ativo", atualizadoEm: null };
let clientes = [ {...,status: statusPadrao}, {...,status: statusPadrao}, {...,status: statusPadrao} ];
```

Mudar o status de um cliente mutava o objeto compartilhado → **todos mudavam juntos**.
A correção usa uma fábrica que gera um objeto novo por cliente:

```js
function novoStatus(valor = "ativo") { return { valor, atualizadoEm: null }; }
```

## 🔑 Credenciais de teste

Usuário `mor_2314` · Senha `83r5^_` (ou clique em **"preencher credenciais de teste"** na tela de login).

## 🚀 Rodar localmente

```bash
# qualquer servidor estático, ex.:
python3 -m http.server 8000
# abra http://localhost:8000
```

## ☁️ Deploy (Vercel)

Projeto estático — a Vercel detecta automaticamente. O `vercel.json` já está incluído.

```bash
npx vercel --prod
```
