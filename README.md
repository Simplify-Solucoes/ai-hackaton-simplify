# Fluxo — Gestão inteligente

Aplicação de CRM estática construída com HTML, CSS e JavaScript puros. Não requer Docker, banco de dados ou servidor: abra o arquivo `index.html` diretamente em um navegador moderno.

## Acesso de demonstração

| Campo | Credencial |
| --- | --- |
| E-mail | `admin@simplify.com` |
| Senha | `Simplify@2026` |

Antes de entrar, resolva o CAPTCHA matemático exibido no formulário. O desafio pode ser renovado pelo botão `↻`.

## Recursos

- Dashboard interativo e gestão de clientes.
- Cadastro, edição, atualização de status e exclusão com confirmações SweetAlert2.
- Telefone com máscara, consulta de CEP pela ViaCEP e preenchimento assistido de endereço.
- Dados de clientes persistidos no `localStorage` do navegador, com carga inicial de usuários da [Fake Store API](https://fakestoreapi.com/users).
- Catálogo conectado à [Fake Store API](https://fakestoreapi.com/).
- Drawer lateral de produto e carrinho persistente, com ajuste de quantidades e cálculo do total.
- Log de auditoria persistente para ações de acesso, clientes, endereços e carrinho.
- Login demonstrativo com PBKDF2 e bloqueio temporário após tentativas inválidas.

> O login e o CAPTCHA são proteções de demonstração para uma aplicação 100% estática. Em produção, credenciais e verificações devem ser validadas por um backend seguro.
