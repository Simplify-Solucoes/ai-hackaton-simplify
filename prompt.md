# Prompt e requisitos do projeto

## Solicitação inicial

Você é um programador com anos de experiência e um expert em UIs, com ideias novas e modernas sobre cores atuais e mesclagem.

Faça o download do repositório `https://github.com/Simplify-Solucoes/ai-hackaton-simplify.git`.

Deverá ler o código atual e implementar/corrigir utilizando HTML normal, JavaScript e CSS — sem linguagem dinâmica — para acessar diretamente do browser.

Tarefas:

1. Resolver o bug em que, ao mudar o status de um cliente, o status de todos muda ao mesmo tempo.
2. Criar um catálogo de API utilizando `https://fakestoreapi.com`, moderno e elegante.
3. Criar uma função para adicionar, editar e excluir clientes, com confirmação para atualizar e excluir.
   - Importante: persistir os clientes ao excluir.
4. Fazer um visual bonito, elegante, premium e inovador.
5. Criar um dashboard interativo.
6. Implementar login.

Pode usar banco de dados SQLite por ser um teste.

Criar segurança no login.

Fazer o push em `git@github.com:marcelosimplify/ai-hackaton-simplify.git`.

## Restrições e evoluções solicitadas

- Sem Docker; apenas rodando em HTML, diretamente no navegador.
- Utilizar SweetAlert2 nas janelas de confirmação.
- Adicionar CAPTCHA no login.
- Melhorar o catálogo para que textos e informações nunca fiquem sobrepostos às fotos dos produtos.
- Ao clicar em um produto, exibir um modal lateral com suas informações, permitir adicioná-lo ao carrinho e calcular o valor total do carrinho considerando os itens e suas quantidades.
- Documentar no README as credenciais de acesso de demonstração.

## Credenciais de demonstração

- E-mail: `admin@simplify.com`
- Senha: `Simplify@2026`

## Resultado esperado

Uma aplicação estática, responsiva e acessível diretamente pelo `index.html`, com CRM, catálogo integrado, carrinho, persistência no navegador, login demonstrativo seguro para o contexto estático, CAPTCHA e interface visual moderna.
