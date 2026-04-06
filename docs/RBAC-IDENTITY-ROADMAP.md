# Roadmap e Documentação Técnica

## RBAC granular para o `identity-service`

## 1. Objetivo

Este documento consolida:

- a análise do estado atual do `identity-service`;
- as inconsistências do plano inicial de RBAC;
- a arquitetura recomendada para um RBAC granular;
- o roadmap técnico de implementação;
- os gaps do projeto atual que precisam ser resolvidos, mesmo quando ainda não existirem no código.

O foco é entregar um caminho realista para sair do modelo atual de `role` única por usuário para um modelo de autorização mais granular, auditável e compatível com as regras de negócio do sistema corporativo de compliance e auditoria.

Este documento foi atualizado considerando que o projeto ainda está em fase inicial de desenvolvimento. Portanto:

- compatibilidade retroativa não é prioridade absoluta;
- preservar contratos ruins apenas para evitar refactor não é um objetivo;
- é aceitável fazer mudanças estruturais mais profundas agora para evitar dívida técnica permanente;
- quando houver conflito entre “migrar sem tocar muito” e “consertar a base corretamente”, este roadmap prioriza corrigir a base.

## 2. Resumo executivo

Hoje o projeto não possui RBAC granular. O que existe é:

- uma coluna `users.role` no banco;
- uma `role` única no agregado `User`;
- uma `role` única no JWT;
- checagens manuais de autorização nos controllers;
- middleware compartilhado que conhece apenas `userRole`.

Esse modelo funciona para controle simples, mas não suporta:

- matriz de acesso por módulo;
- separação entre ações `self` e `any`;
- evolução segura de permissões;
- auditoria centralizada de decisões de autorização;
- rollout progressivo entre serviços do monorepo.

O RBAC alvo continua organizado em fases, mas com liberdade para substituir partes mal desenhadas do modelo atual sem carregar compatibilidade desnecessária.

## 3. Estado atual do código

### 3.1 Modelo de dados atual

Em [`packages/identity-service/prisma/schema.prisma`](../packages/identity-service/prisma/schema.prisma), o usuário possui apenas:

- `role: String @default("visualizador")`
- `isActive`
- `failedLoginAttempts`
- `blockedUntil`

Não existem:

- tabela de `roles`;
- tabela de `permissions`;
- associação `role_permissions`;
- associação `user_roles`;
- versionamento de grants;
- sessão revogável;
- mecanismo de invalidação de token por mudança de autorização.

### 3.2 Domínio atual

Em [`packages/identity-service/src/domain/entities/user.entity.ts`](../packages/identity-service/src/domain/entities/user.entity.ts), a entidade `User` carrega diretamente:

- `_role: UserRole`

Em [`packages/identity-service/src/domain/types.ts`](../packages/identity-service/src/domain/types.ts), o sistema define papéis fixos:

- `administrador`
- `compliance_officer`
- `auditor_interno`
- `auditor_externo`
- `gestor`
- `visualizador`

Esse desenho acopla identidade e autorização em um único agregado.

### 3.3 Token atual

Em [`packages/identity-service/src/adapters/driven/auth/jwt-token.service.ts`](../packages/identity-service/src/adapters/driven/auth/jwt-token.service.ts), o JWT contém apenas:

- `sub`
- `email`
- `role`

Em [`packages/shared/src/http/auth.middleware.ts`](../packages/shared/src/http/auth.middleware.ts), o middleware compartilhado popula apenas:

- `req.userId`
- `req.userEmail`
- `req.userRole`

Isso limita qualquer política mais rica.

### 3.4 Autorização HTTP atual

Em [`packages/identity-service/src/adapters/driving/http/user.controller.ts`](../packages/identity-service/src/adapters/driving/http/user.controller.ts), a autorização é feita via `if` no controller:

- `POST /api/users`: exige `administrador`
- `GET /api/users/:id`: exige dono do recurso ou `administrador`

Isso já mostra que a semântica real não é apenas “papel X”, mas também regra contextual (`self` vs `any`).

## 4. Diretriz desta revisão

Como esta é a primeira fase do desenvolvimento, a implementação deve priorizar:

- clareza do modelo;
- consistência entre domínio, persistência, token e middleware;
- contratos corretos desde cedo;
- remoção de decisões erradas já identificadas.

Isso muda a forma de interpretar o roadmap:

- itens de compatibilidade existem apenas quando ajudam na implementação incremental;
- não é obrigatório manter `users.role` até o fim se a migração puder ser feita logo;
- não é obrigatório manter payload antigo de JWT por muito tempo;
- vale mais construir a policy layer correta agora do que proteger controllers antigos.

## 5. Inconsistências identificadas no plano inicial

O plano inicial tinha direção correta, mas precisava de correções para ficar consistente com o projeto e com as regras de negócio.

### 5.1 `user_permissions` no MVP conflita com o requisito de RBAC puro

O documento [`docs/RegrasDeNegocio.md`](./RegrasDeNegocio.md) define:

- `RN-010`: todo usuário deve estar associado a pelo menos um papel;
- `RN-011`: o acesso a módulos e funcionalidades é determinado exclusivamente pelo papel do usuário.

Por isso, a proposta inicial de `user_permissions` no MVP é inconsistente com o requisito funcional. Permissões diretas por usuário aproximam o modelo de ABAC/ACL híbrido e quebram a rastreabilidade centrada em papel.

Decisão corrigida:

- MVP: RBAC estrito com `roles` e `permissions`, sem grants diretos por usuário;
- Fase futura opcional: exceções explícitas por usuário apenas se o negócio mudar e aprovar um modelo híbrido.

### 5.2 Multi-role imediato aumenta complexidade sem necessidade comprovada

O texto de negócio fala em “papel” no singular em vários pontos, e o sistema atual inteiro assume role única.

Nada impede multi-role no futuro, mas implementá-lo no primeiro corte aumenta:

- complexidade de DTOs;
- regras de precedência;
- testes;
- rollout entre serviços;
- risco de conflito semântico.

Decisão corrigida:

- estruturar o banco para suportar evolução futura;
- no MVP, manter um único papel efetivo por usuário;
- modelar isso com tabela relacional e restrição de unicidade por usuário, para permitir futura flexibilização sem reescrever tudo.

### 5.3 Permissões no JWT sem estratégia de revogação seria frágil

Hoje o projeto já documenta que não existe logout server-side nem revogação antecipada de tokens. Expandir o JWT com permissões sem estratégia de revogação deixaria as permissões stale até o `exp`.

Decisão corrigida:

- introduzir `authzVersion` no domínio/autorização;
- usar access token curto;
- adicionar validação de versão de autorização via cache ou consulta rápida nos fluxos protegidos;
- manter rollout compatível com o middleware atual.

Sem isso, uma mudança de papel não teria efeito imediato.

### 5.4 O plano inicial não separava claramente “papel de negócio” de “permissão técnica”

As regras do projeto são escritas em termos de papéis. O código granular, por outro lado, precisa de permissões.

Decisão corrigida:

- o modelo externo continua orientado por papéis;
- permissões passam a ser o mecanismo interno de implementação;
- usuários continuam recebendo um papel de negócio;
- cada papel resolve para um conjunto de permissões versionado.

Isso mantém aderência a `RN-011` sem sacrificar granularidade.

### 5.5 O plano inicial subestimava o impacto transversal no monorepo

O problema não é apenas no `identity-service`. O pacote `shared` e serviços consumidores confiam no payload antigo do JWT.

Decisão corrigida:

- tratar `shared` como parte obrigatória do roadmap;
- migrar serviços consumidores junto com a revisão do token e do middleware;
- usar compatibilidade temporária apenas se ela reduzir trabalho, e não por apego ao desenho atual.

### 5.6 O plano inicial não registrava gaps estruturais já existentes no projeto

Há inconsistências no estado atual que precisam entrar no roadmap:

- os READMEs apontam para `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/SECURITY.md` e outros arquivos inexistentes;
- o projeto não implementa ainda revogação de sessão, apesar de regras de negócio apontarem necessidade;
- a exclusão lógica de usuários (`RN-092`) não está fechada no serviço atual;
- a resposta de OAuth não expõe o mesmo perfil de autorização retornado no login tradicional;
- a auditoria de autorização está espalhada em controllers, não centralizada.

Esses itens precisam constar no plano como dívida técnica explícita.

## 6. Princípios do desenho alvo

O RBAC granular proposto deve seguir estes princípios:

1. `Deny by default`.
2. Papel continua sendo a unidade de governança de negócio.
3. Permissão é a unidade interna de enforcement.
4. O `identity-service` emite contexto de autorização consistente.
5. O `shared` faz o parsing desse contexto de forma compatível.
6. A decisão de autorização sai dos controllers e vai para middleware/policy.
7. Toda mudança de papel e toda negação de acesso relevante deve ser auditada.
8. Mudança de autorização precisa ter efeito rápido e previsível.

## 7. Arquitetura recomendada

## 7.1 Modelo conceitual

Modelo recomendado para o MVP:

- `Role`
- `Permission`
- `RolePermission`
- `UserRole`
- `AuthorizationVersion`

Modelo propositalmente fora do MVP:

- `UserPermission`
- ACL por recurso individual
- políticas dinâmicas por atributo

Esses itens só devem entrar se houver caso de uso real aprovado.

## 7.2 Papel versus permissão

### Papel

Entidade de negócio administrável:

- `administrador`
- `compliance_officer`
- `auditor_interno`
- `auditor_externo`
- `gestor`
- `visualizador`

### Permissão

Capacidade técnica verificável:

- `users.create`
- `users.read.self`
- `users.read.any`
- `users.update`
- `users.deactivate`
- `roles.assign`
- `roles.read`
- `audit.logs.read.any`
- `audit.logs.read.scoped`
- `compliance.rules.create`
- `compliance.rules.update`
- `compliance.rules.deactivate`
- `dashboard.read`
- `reports.read`
- `reports.export`
- `integrations.read`
- `integrations.manage`
- `system.settings.manage`

Os nomes exatos devem ser versionados e tratados como contrato.

## 7.3 Matriz inicial de permissões

### Administrador

- gestão completa de usuários;
- atribuição de papéis;
- leitura ampla;
- gestão de integrações;
- gestão de configurações.

### Compliance Officer

- leitura ampla de conformidade;
- criação, edição e desativação de regras de compliance;
- leitura de logs de auditoria;
- sem administração global de identidade.

### Auditor Interno

- leitura ampla de auditoria e relatórios;
- sem alterações administrativas.

### Auditor Externo

- leitura restrita ao escopo atribuído;
- sem exportação fora do escopo;
- sem mutação administrativa.

### Gestor

- leitura operacional e dashboards;
- leitura limitada a seu escopo organizacional;
- sem administração de identidade.

### Visualizador

- leitura básica limitada;
- sem mutações.

Observação importante:

- `escopo` ainda não está modelado no projeto;
- por isso, permissões `*.scoped` exigirão trabalho adicional de contexto;
- no MVP, algumas permissões podem começar como `any` ou ficarem bloqueadas até o domínio de escopo existir.

## 8. Lacunas do projeto que precisam entrar no roadmap

Esta seção lista o que está faltando ou mal resolvido no projeto atual e deve ser tratado como parte do esforço, mesmo que ainda não exista implementação.

### 8.1 Documentação raiz quebrada

O repositório referencia múltiplos documentos inexistentes no `docs/` raiz.

Impacto:

- dificulta onboarding;
- reduz confiabilidade do material técnico;
- esconde dívida arquitetural.

Ação:

- criar documentação mínima real;
- remover ou corrigir links quebrados;
- incluir este roadmap na navegação do projeto.

### 8.2 Ausência de revogação de autorização

Hoje, mudança de role não invalida token emitido anteriormente.

Ação:

- adicionar `authorization_version`;
- definir estratégia de cache/verificação;
- reduzir tempo de vida do access token;
- planejar revogação de sessão.

### 8.3 Sessão e logout ainda incompletos

As regras de negócio falam em:

- timeout por inatividade;
- controle de múltiplas sessões;
- encerramento de sessões ao desativar usuário.

O projeto atual não entrega isso.

Ação:

- criar épico separado de sessão;
- acoplar invalidade de autorização com invalidade de sessão.

### 8.4 Exclusão lógica ainda não fechada

As regras de negócio exigem inativação, não remoção física, para usuários de produção.

O código já possui `isActive`, mas a superfície funcional ainda não está fechada como gestão de ciclo de vida completa do usuário.

Ação:

- formalizar endpoints de ativação/desativação;
- impedir exclusão física fora de cenários de teste/migração;
- encerrar sessões e invalidar grants quando houver desativação.

### 8.5 Falta de política centralizada

Hoje os controllers decidem autorização na mão.

Ação:

- criar middleware/policy layer no `shared`;
- mover auditoria de `access_denied` para uma camada reutilizável.

### 8.6 Falta de contratos consistentes entre fluxos de autenticação

`register` e `login` retornam um perfil; `oauth-callback` retorna outro.

Ação:

- unificar contrato de identidade/autorização para login por senha e OAuth;
- decidir contrato canônico para `AuthUserDto`.

## 9. Estratégia de execução para fase inicial

Como o projeto ainda está em fase inicial, a estratégia recomendada não é “adaptar o mínimo possível”, e sim:

1. corrigir o modelo de autorização no banco;
2. corrigir o domínio e os DTOs;
3. corrigir o token;
4. corrigir o `shared`;
5. corrigir os endpoints protegidos;
6. só depois estabilizar contratos.

Em outras palavras:

- é aceitável quebrar migrations antigas de desenvolvimento se isso produzir um schema melhor;
- é aceitável remover `role` legada cedo;
- é aceitável reescrever partes do middleware compartilhado;
- é aceitável unificar respostas HTTP mesmo que isso quebre testes antigos, desde que os testes sejam atualizados junto.

O objetivo desta fase não é “não quebrar nada”. O objetivo é construir a base certa.

## 10. Roadmap de implementação

## Fase 0. Preparação e alinhamento

Objetivo:

- alinhar negócio, segurança e arquitetura antes de alterar schema e token.

Entregas:

- catálogo inicial de permissões;
- matriz papel -> permissões;
- definição do que fica no MVP e do que fica fora;
- definição formal de compatibilidade de JWT;
- inventário de endpoints protegidos por papel/permissão.

Critérios de aceite:

- matriz aprovada;
- nomes de permissões congelados para o MVP;
- documentação de rollout validada.

## Fase 1. Modelo de dados de autorização

Objetivo:

- criar a base relacional do RBAC sem quebrar produção.

Mudanças:

- criar tabela `roles`;
- criar tabela `permissions`;
- criar tabela `role_permissions`;
- criar tabela `user_roles`;
- adicionar `authorization_version` em `users`;
- remover dependência funcional de `users.role`.

Recomendação de schema para o MVP:

- `user_roles.user_id` com `UNIQUE`, garantindo um único papel efetivo por usuário;
- `roles.code` e `permissions.code` como identificadores estáveis;
- constraints e índices para leitura rápida.

Critérios de aceite:

- migration reversível;
- seed inicial de papéis e permissões;
- backfill de `users.role` para `user_roles`, se a coluna ainda for aproveitada durante a transição;
- ou remoção direta da coluna legada, se o time optar por limpar o schema já nesta fase.

## Fase 2. Refatoração do domínio e da aplicação

Objetivo:

- desacoplar identidade de autorização.

Mudanças:

- manter `User` focado em identidade, status e autenticação;
- criar `AuthorizationProfile` ou equivalente;
- criar serviço de resolução de permissões efetivas;
- adaptar repositórios para carregar papel e permissões.

Importante:

- não mover toda a autorização para dentro da entidade `User`;
- autorização granular deve viver como subdomínio/coerência própria.

Critérios de aceite:

- use cases conseguem resolver papel e permissões do usuário;
- domínio deixa de depender só de `User.role`.

## Fase 3. Evolução do JWT e do `shared`

Objetivo:

- emitir contexto de autorização rico e correto.

Payload recomendado:

- `sub`
- `email`
- `roles` ou `primaryRole`
- `permissions`
- `authzVersion`

Decisão recomendada para o MVP:

- usar `primaryRole` em vez de `roles[]`, pois o corte inicial é single-role;
- remover `role` legada assim que `shared` e serviços consumidores forem atualizados;
- considerar `roles[]` apenas quando multi-role for oficialmente adotado.

Mudanças:

- evoluir `TokenPayload`;
- evoluir `JwtTokenService`;
- evoluir `JwtTokenVerifier`;
- evoluir `createAuthMiddleware`.

Critérios de aceite:

- token novo é aceito pelo código novo;
- request autenticada passa a carregar `userPrimaryRole`, `userPermissions` e `authzVersion`;
- a codebase deixa de depender semanticamente de `userRole` bruto.

## Fase 4. Policy layer compartilhada

Objetivo:

- retirar autorização manual dos controllers.

Componentes a criar no `shared`:

- `requirePermission(permission)`
- `requireAnyPermission(permissions[])`
- helper para `self` vs `any`
- auditoria centralizada de `access_denied`

Exemplo de regra:

- `GET /users/:id`
- permite `users.read.any`
- ou `users.read.self` quando `req.userId === req.params.id`

Critérios de aceite:

- controllers deixam de ter `if` hardcoded de papel;
- negações são auditadas num ponto único.

## Fase 5. Migração dos endpoints do `identity-service`

Objetivo:

- tornar o próprio serviço aderente ao novo RBAC.

Mudanças:

- `POST /api/users` passa a exigir `users.create`;
- `GET /api/users/:id` passa a exigir `users.read.any` ou `users.read.self`;
- novos endpoints de administração de papel:
  - listar papéis;
  - consultar papel atual do usuário;
  - atribuir papel;
  - remover/substituir papel;
- endpoints de ciclo de vida:
  - ativar usuário;
  - desativar usuário.

Critérios de aceite:

- endpoints protegidos por permissão;
- contratos HTTP atualizados;
- auditoria de mudança de papel implementada.

## Fase 6. Compatibilidade com OAuth, login e registro

Objetivo:

- unificar a superfície de autenticação.

Mudanças:

- `register`, `login` e `oauth-callback` retornam o mesmo perfil de autorização;
- `me` retorna perfil consistente;
- DTOs e OpenAPI atualizados.

Critérios de aceite:

- o front-end não precisa tratar modelos diferentes para senha e OAuth.

## Fase 7. Revogação e consistência de autorização

Objetivo:

- fazer mudança de papel surtir efeito rápido.

Mudanças:

- incrementar `authorization_version` ao alterar papel;
- validar versão no request protegido;
- usar cache para evitar carga excessiva no banco;
- encerrar sessões ou invalidar tokens quando o usuário for desativado.

Critérios de aceite:

- após troca de papel, token antigo perde validade em janela definida;
- usuário desativado perde acesso imediatamente.

## Fase 8. Migração dos demais serviços do monorepo

Objetivo:

- fazer `catalog-service` e futuros serviços consumirem o novo contexto.

Mudanças:

- adotar middlewares de permissão;
- remover dependência exclusiva de `userRole`;
- revisar todos os serviços que verificam JWT via `shared`.

Critérios de aceite:

- nenhum serviço depende funcionalmente apenas da `role` legada.

## Fase 9. Remoção do legado

Objetivo:

- encerrar o rollout sem ambiguidade.

Mudanças:

- remover qualquer uso remanescente de `users.role`, se ainda existir;
- remover `role` legada do token, se ainda existir;
- remover branches de compatibilidade do `shared`;
- atualizar testes, documentação e seeds.

Pré-condições:

- todos os consumidores migrados;
- janela de transição encerrada;
- observabilidade suficiente para detectar regressões.

## 11. Modelo de dados recomendado

Sugestão de tabelas para o MVP:

### `roles`

- `id`
- `code`
- `name`
- `description`
- `is_system`
- `created_at`
- `updated_at`

### `permissions`

- `id`
- `code`
- `name`
- `description`
- `module`
- `created_at`
- `updated_at`

### `role_permissions`

- `role_id`
- `permission_id`
- `created_at`

### `user_roles`

- `id`
- `user_id`
- `role_id`
- `assigned_by`
- `assigned_at`

Para o MVP:

- `UNIQUE (user_id)` para manter um único papel efetivo.

### `users`

Adicionar:

- `authorization_version INT NOT NULL DEFAULT 1`

Se a implementação optar por transição curta:

- `role` legado pode existir apenas para backfill.

Se a implementação optar por limpeza direta:

- a coluna `role` deve ser removida já no novo schema.

## 12. Contrato de token recomendado

Formato recomendado no MVP:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "primaryRole": "administrador",
  "permissions": [
    "users.create",
    "users.read.any",
    "roles.assign"
  ],
  "authzVersion": 3,
  "iat": 1710000000,
  "exp": 1710003600
}
```

Notas:

- `primaryRole` é o campo canônico do MVP;
- `permissions` é o conjunto efetivo resolvido no momento da emissão;
- `authzVersion` é obrigatório para estratégia de revogação.

Se for necessário um período curto de transição, `role` pode coexistir temporariamente. Mas o contrato alvo correto do projeto deve ser o modelo acima.

## 13. Estratégia de autorização HTTP

Decisão recomendada:

- autenticação continua no middleware base;
- autorização vai para middleware específico de policy;
- controllers recebem request já autorizada.

Fluxo:

1. `createAuthMiddleware` valida token.
2. Middleware de contexto popula `userPrimaryRole`, `userPermissions`, `authzVersion`.
3. Middleware de autorização avalia a policy.
4. Se negar, audita e responde `403`.
5. Controller executa apenas lógica de aplicação.

## 14. Auditoria

Eventos mínimos adicionais:

- `identity.auth.role_assigned`
- `identity.auth.role_removed`
- `identity.auth.role_changed`
- `identity.auth.permission_denied`
- `identity.auth.authorization_changed`

Toda negação relevante deve registrar:

- usuário ator;
- papel efetivo;
- permissão exigida;
- recurso;
- alvo, quando houver;
- IP;
- request id;
- timestamp.

## 15. Testes necessários

### Unitários

- resolução de permissões por papel;
- compatibilidade de token antigo e novo;
- middleware de permissão;
- regras `self` vs `any`.

### Integração

- login emite token novo;
- OAuth emite token novo;
- troca de papel altera permissões emitidas;
- `403` em ausência de permissão;
- `200/201` com permissão correta;
- token antigo falha após mudança de `authzVersion`, quando aplicável.

### Contrato

- `shared` e serviços consumidores interpretam o mesmo payload;
- OpenAPI reflete os DTOs reais.

## 16. Refactors aceitáveis nesta fase

Como esta é uma fase inicial de desenvolvimento, os seguintes refactors são recomendados e não devem ser evitados apenas para “preservar o que existe”:

- trocar `role` simples por `primaryRole` + `permissions` nos DTOs;
- reescrever `TokenPayload` no `identity-service` e no `shared`;
- mudar a tipagem global de `Express.Request`;
- remover checks de autorização dos controllers;
- reestruturar `userResponseDtoSchema` e `auth-response`;
- unificar a resposta de OAuth com a de login tradicional;
- criar migrations novas substituindo decisões ruins do schema atual;
- ajustar ou reescrever testes que codificam contratos errados.

## 17. Itens fora do MVP, mas recomendados

- multi-role real;
- grants temporários com expiração;
- escopo por organização/unidade/auditoria;
- política declarativa por recurso;
- introspecção central de token;
- refresh token com revogação server-side;
- sessão única opcional por usuário;
- tela administrativa de matriz de permissões.

## 18. Riscos principais

### Risco 1. Permissões stale em token

Mitigação:

- `authzVersion`
- TTL curto
- cache de versão

### Risco 2. Rollout quebrar serviços consumidores

Mitigação:

- migrar `shared` cedo;
- atualizar consumidores no mesmo ciclo de trabalho;
- usar compatibilidade apenas quando reduzir custo real.

### Risco 3. Matriz de permissões ambígua

Mitigação:

- catálogo versionado
- naming estável
- aprovação funcional antes do código

### Risco 4. Mistura indevida de RBAC com regras de escopo

Mitigação:

- documentar o que é RBAC puro;
- tratar escopo como camada separada de policy contextual.

## 19. Ordem recomendada de execução

1. Aprovar matriz papel -> permissões.
2. Criar schema novo e backfill.
3. Executar **Fase 2 — Refatoração do domínio e da aplicação**: separar autorização de `User`, introduzir `AuthorizationProfile` e resolução de permissões efetivas.
4. Introduzir `authorization_version`.
5. Evoluir JWT e `shared` para o contrato correto.
6. Criar middleware de policy.
7. Migrar endpoints do `identity-service`.
8. Unificar DTOs de auth e OAuth.
9. Implementar revogação lógica de autorização.
10. Migrar serviços consumidores.
11. Remover legado residual.

## 20. Critérios de pronto

O RBAC granular pode ser considerado entregue quando:

- o banco não depende funcionalmente de `users.role`;
- o token carrega contexto de autorização consistente;
- o `shared` faz parsing do novo contexto;
- os controllers não possuem checagens hardcoded de papel;
- as decisões de autorização são auditadas;
- troca de papel invalida autorização anterior em janela aceitável;
- os fluxos de login, registro e OAuth retornam contratos coerentes;
- os serviços consumidores usam permissão, não papel bruto, para enforcement.

## 21. Decisões finais recomendadas

- Não implementar `user_permissions` no MVP.
- Não implementar multi-role no MVP.
- Implementar `roles + permissions` com um único papel efetivo por usuário.
- Manter `role` legada apenas se isso realmente reduzir esforço de transição.
- Colocar `primaryRole`, `permissions` e `authzVersion` no token novo.
- Levar authorization enforcement para middleware compartilhado.
- Tratar revogação de autorização como requisito do roadmap, não como melhoria opcional.
- Aproveitar a fase inicial para corrigir contratos ruins, mesmo que isso exija refactor maior.

## 22. Referências

- [`docs/RegrasDeNegocio.md`](./RegrasDeNegocio.md)
- [`docs/RequisitosCorp.md`](./RequisitosCorp.md)
- [`packages/identity-service/README.md`](../packages/identity-service/README.md)
- [`packages/identity-service/docs/README.md`](../packages/identity-service/docs/README.md)
- [`packages/identity-service/prisma/schema.prisma`](../packages/identity-service/prisma/schema.prisma)
- [`packages/identity-service/src/domain/entities/user.entity.ts`](../packages/identity-service/src/domain/entities/user.entity.ts)
- [`packages/identity-service/src/domain/types.ts`](../packages/identity-service/src/domain/types.ts)
- [`packages/identity-service/src/adapters/driven/auth/jwt-token.service.ts`](../packages/identity-service/src/adapters/driven/auth/jwt-token.service.ts)
- [`packages/shared/src/http/auth.middleware.ts`](../packages/shared/src/http/auth.middleware.ts)


---
