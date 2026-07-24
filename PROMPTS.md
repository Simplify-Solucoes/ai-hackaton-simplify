# PROMPTS.md — Esdras CRM

Registro dos prompts usados na construção do projeto, com a IA utilizada em cada um.
A ferramenta principal foi o **[Claude]** (Claude Code, modelo Opus 4.8), conduzido de
forma iterativa: contexto → geração → revisão crítica → correção.

> Observação de método: os prompts abaixo mostram condução intencional. Em vez de pedir
> "faça um CRM", eu (1) forneci o desafio completo como contexto, (2) tomei decisões de
> arquitetura antes de gerar código, (3) exigi a **causa raiz** do bug e não um contorno,
> e (4) revisei cada entrega (paleta de cores acessível, escape de HTML, persistência).

---

## 1. [Claude] Contexto inicial e diagnóstico

> Colei o enunciado completo do desafio (os 7 desafios + rubrica de avaliação) e pedi
> para o Claude analisar o `index.html` starter antes de escrever qualquer código.

**Prompt:**
```
[enunciado completo dos 7 desafios e critérios de avaliação colados]
```

**Condução crítica:** em vez de deixar a IA começar a codar direto, pedi que ela primeiro
lesse o projeto, identificasse o bug e propusesse a stack. A IA identificou corretamente
o bug de **referência compartilhada** no objeto `statusPadrao` e me apresentou duas
decisões (stack e escopo), que eu respondi: **vanilla single-file** + **todos os 7 desafios**.

---

## 2. [Claude] Identificação da causa raiz do bug (Desafio 2)

**Prompt (refinamento):**
```
Explique a causa raiz do bug do starter, não apenas o sintoma. Quero poder
explicar isso no vídeo de avaliação.
```

**Resposta revisada e aceita:** no starter, os três clientes recebem **o mesmo objeto**:
```js
const statusPadrao = { valor: "ativo", atualizadoEm: null };
let clientes = [ { ..., status: statusPadrao }, { ..., status: statusPadrao }, ... ];
```
Como `mudarStatus` faz `cliente.status.valor = novoValor`, ele muta o objeto compartilhado
e **todos os clientes mudam de status juntos**. Correção na raiz: uma fábrica `novoStatus()`
que dá a cada cliente seu próprio objeto. (Ver `novoStatus` em `index.html`.)

---

## 3. [Claude] Construção da aplicação completa

**Prompt:**
```
Construa o index.html completo, single-file vanilla, cobrindo os 7 desafios:
- Login via fakestoreapi.com/auth/login (gate da aplicação)
- Dashboard interativo com KPIs e gráficos
- Clientes: CRUD (adicionar/excluir), mudança de status, bug corrigido
- Persistência em localStorage
- Catálogo de produtos via fakestoreapi.com/products com busca/filtro/ordenação
- Visual profissional/empresarial: sidebar, topbar, cards, dark mode
```

**Condução crítica:** exigi que os gráficos seguissem uma paleta **acessível para
daltônicos** e que status nunca fossem comunicados só por cor (sempre ícone + rótulo).
Validei a paleta categórica e de estado com a metodologia de data-viz antes de aplicar.

---

## 4. [Claude] Integração real com a API e teste de credenciais

**Prompt:**
```
Antes de implementar o login, teste o endpoint de auth da fakestoreapi e me diga
um par de credenciais válido para eu usar na demo.
```

**Resultado:** a IA testou via `curl` o `POST /auth/login` e confirmou o usuário de teste
`mor_2314` / `83r5^_`, que retorna um token JWT. Também busquei o nome real do usuário em
`/users` para enriquecer a UI. O botão "preencher credenciais de teste" facilita a avaliação.

---

## 5. [Claude] Revisão de segurança/robustez

**Prompt:**
```
Revise o código: há risco de XSS ao renderizar nome/e-mail de clientes ou títulos
de produtos vindos da API? A persistência sobrevive a um localStorage corrompido?
```

**Ajustes aplicados após revisão:**
- `escapeHtml()` em todo conteúdo dinâmico inserido via `innerHTML`.
- `carregarClientes()` com `try/catch` e normalização: se o JSON estiver corrompido,
  cai no seed; e cada cliente carregado ganha um objeto de status **próprio** (reforça o fix).
- Deduplicação por e-mail ao importar clientes da API.

---

## Ferramentas de IA utilizadas

| IA | Uso |
|----|-----|
| **[Claude]** (Opus 4.8, via Claude Code) | Diagnóstico do bug, arquitetura, geração do código, integração com a API, revisão crítica de acessibilidade e segurança. |

Todos os prompts foram adaptados ao contexto do projeto (não genéricos), com iteração e
revisão crítica das respostas — nada foi colado sem verificação.
