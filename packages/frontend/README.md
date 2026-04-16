# Frontend

Aplicação React (Vite + Ant Design) com arquitetura modular, consumindo apenas o BFF.

- Porta padrão: `5173`
- Base de integração pública: `/auth`, `/compliance`, `/audit`, `/risk`, `/reports`, `/notifications`, `/admin`, `/integrations`

## Scripts

```bash
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend preview
```

## Estrutura

```text
src/
  app/            # bootstrap, router, providers e layout global
  features/       # páginas e contexto por domínio de produto
  application/    # casos de uso do frontend e DTOs
  infrastructure/ # clients HTTP e integração técnica com BFF
  shared/         # UI compartilhada, hooks, config e utilitários
  styles/         # tokens, temas e estilos globais
```

## Fronteira de responsabilidades

- Frontend:
  - navegação, layout, formulários, validação de entrada e estados de tela;
  - controle de sessão no cliente e gate visual por permissão;
  - orquestração de queries/mutations e renderização de tabelas/cards/modais.
- Não frontend:
  - autenticação/autorização efetiva, regras de negócio, auditoria e retenção;
  - consistência de dados, persistência, mensageria e observabilidade;
  - disponibilidade dos serviços e infraestrutura de deploy.

## Fluxos cobertos

- OAuth e sessão (`/auth/*`) com callback no frontend (`/login/{provider}/callback`).
- Compliance: listar, criar e editar violações.
- Auditoria: consulta de logs.
- Retenção: consulta de execuções (audit/compliance).
- Risco: scorecards e ingestão manual de evento.
- Notificações: histórico e disparo manual.
- Integrações: publicação de evento manual.
- Relatórios: exportar, consultar e baixar arquivo.
- Administração: listar/criar usuários, cargos, segurança e desativação.
- Time: visão de sessão/permissões do usuário logado.
