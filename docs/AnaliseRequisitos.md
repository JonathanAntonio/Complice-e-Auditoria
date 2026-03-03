# Análise de Requisitos — Sistema Corporativo de Compliance e Auditoria

## 1. Objetivo da Análise

Este documento apresenta a análise detalhada dos requisitos do **Sistema Corporativo de Compliance e Auditoria**, com base nos documentos `IdeiaInicial.md`, `RequisitosCorp.md` e `VisaoGeralProjeto.md`.

O objetivo é detalhar, classificar e priorizar os requisitos funcionais e não funcionais, identificar stakeholders, mapear casos de uso e levantar restrições e riscos do projeto.

---

## 2. Stakeholders

| Stakeholder | Papel | Interesse no Sistema |
|---|---|---|
| Diretoria / Executivos | Usuário estratégico | Visualização de KPIs e dashboards executivos |
| Compliance Officer | Usuário principal | Gestão de regras, violações e conformidade |
| Departamento Jurídico | Usuário consultivo | Relatórios regulatórios e histórico de eventos |
| Auditor Interno | Usuário operacional | Trilhas de auditoria e registros de ações |
| Auditor Externo | Usuário consultivo | Acesso controlado a logs e relatórios |
| Administrador do Sistema | Usuário técnico | Gestão de usuários, perfis e configurações |
| Time de TI / DevOps | Equipe técnica | Infraestrutura, deploy, monitoramento |
| Sistemas Externos (ERPs, CRMs) | Integração | Envio e recebimento de eventos via API/Webhook |

---

## 3. Requisitos Funcionais

### 3.1 Priorização (MoSCoW)

| ID | Requisito | Módulo | Prioridade |
|---|---|---|---|
| RF01 | Cadastro, edição e exclusão de usuários | Gestão de Usuários | Must Have |
| RF02 | Controle de perfis e permissões (RBAC) | Controle de Acesso | Must Have |
| RF03 | Autenticação segura via JWT ou OAuth2 | Gestão de Usuários | Must Have |
| RF04 | Recuperação de senha | Gestão de Usuários | Must Have |
| RF05 | Controle de sessão com expiração configurável | Gestão de Usuários | Must Have |
| RF06 | Autorização por papéis e módulos | Controle de Acesso | Must Have |
| RF07 | Logs de acesso (login, logout, tentativas inválidas) | Controle de Acesso | Must Have |
| RF08 | Registro imutável de ações dos usuários | Auditoria | Must Have |
| RF09 | Histórico de alterações por entidade de negócio | Auditoria | Must Have |
| RF10 | Versionamento de dados críticos | Auditoria | Must Have |
| RF11 | Dashboard com KPIs estratégicos e operacionais | Dashboard | Must Have |
| RF12 | Filtros por período, área e nível de risco | Dashboard | Must Have |
| RF13 | Exportação de relatórios (PDF, CSV) | Relatórios | Should Have |
| RF14 | Atualização dinâmica dos KPIs em tempo real | Dashboard | Should Have |
| RF15 | Motor de regras de compliance configurável | Compliance Engine | Must Have |
| RF16 | Geração de violações e pendências | Compliance Engine | Must Have |
| RF17 | Cálculo de pontuação de risco por evento/usuário/área | Risk Analysis | Should Have |
| RF18 | Integração bidirecional com ERPs e CRMs via API/Webhook | Integration Service | Must Have |
| RF19 | Envio de alertas automáticos (e-mail, webhook) | Notification Service | Should Have |
| RF20 | Machine Learning para detecção de padrões suspeitos | Risk Analysis | Could Have |

---

## 4. Requisitos Não Funcionais

### 4.1 Segurança

| ID | Requisito | Critério de Aceitação |
|---|---|---|
| RNF01 | Criptografia de dados sensíveis em repouso e em trânsito | HTTPS/TLS obrigatório; campos críticos criptografados no banco |
| RNF02 | Proteção contra SQL Injection e XSS | Seguir boas práticas OWASP Top 10 |
| RNF03 | Rate limiting em APIs externas | Limite configurável por endpoint |
| RNF04 | Backup automatizado | Backup diário com retenção mínima de 30 dias |
| RNF05 | Compliance com LGPD | Política de retenção, controle de acesso e consentimento implementados |
| RNF06 | Assinatura digital de eventos críticos | Logs de auditoria assinados digitalmente |
| RNF07 | Controle de auditoria sobre o próprio sistema | Ações administrativas também auditadas |

### 4.2 Performance

| ID | Requisito | Critério de Aceitação |
|---|---|---|
| RNF08 | Baixo tempo de resposta para operações síncronas | P95 < 500ms para APIs críticas |
| RNF09 | Cache para dados frequentemente consultados | Redis implementado para regras, configurações e parâmetros estáveis |
| RNF10 | Otimização de consultas ao banco relacional | Uso de índices e planos de execução validados |
| RNF11 | Processamento assíncrono para tarefas pesadas | Relatórios e análises complexas via filas |

### 4.3 Escalabilidade

| ID | Requisito | Critério de Aceitação |
|---|---|---|
| RNF12 | Escalabilidade horizontal dos microsserviços | Suporte a múltiplas instâncias com balanceamento de carga |
| RNF13 | Arquitetura desacoplada | Microsserviços independentes, comunicação via mensageria |

### 4.4 Disponibilidade

| ID | Requisito | Critério de Aceitação |
|---|---|---|
| RNF14 | Alta disponibilidade para serviços críticos | SLA mínimo de 99,5% para Audit Service e Compliance Engine |
| RNF15 | Monitoramento com métricas e alertas | Health checks expostos por cada serviço; dashboards de infraestrutura |
| RNF16 | Failover configurado para infraestrutura crítica | Configurado para banco de dados e mensageria |

### 4.5 Interoperabilidade

| ID | Requisito | Critério de Aceitação |
|---|---|---|
| RNF17 | APIs RESTful padronizadas | Convenções de recursos, verbos HTTP e status codes corretos |
| RNF18 | Comunicação via JSON | Formato padrão em todas as integrações |
| RNF19 | Versionamento de API | Suporte a múltiplas versões sem quebra de integrações existentes |

---

## 5. Casos de Uso Principais

### UC01 — Registro de Evento de Auditoria

- **Ator:** Sistema externo (ERP, CRM) ou usuário interno
- **Fluxo principal:**
  1. Ator realiza uma ação no sistema externo.
  2. Sistema externo envia evento via API ou Webhook.
  3. Integration Service recebe, valida e publica o evento no RabbitMQ.
  4. Audit Service consome o evento e grava de forma imutável no banco não relacional.
  5. Compliance Engine valida as regras aplicáveis.
  6. Se houver violação, gera alerta e atualiza KPIs.
- **Pré-condição:** Integração autenticada e autorizada.
- **Pós-condição:** Evento registrado e imutável; violações e alertas gerados se aplicável.

---

### UC02 — Visualização de Dashboard Executivo

- **Ator:** Diretoria, Compliance Officer, Auditor
- **Fluxo principal:**
  1. Usuário acessa o dashboard com suas credenciais.
  2. Sistema exibe KPIs conforme perfil e permissões.
  3. Usuário aplica filtros por período, área ou nível de risco.
  4. Sistema atualiza os indicadores dinamicamente.
  5. Usuário exporta relatório se necessário.
- **Pré-condição:** Usuário autenticado e com permissão de visualização.
- **Pós-condição:** Dados visualizados e/ou exportados.

---

### UC03 — Gestão de Regras de Compliance

- **Ator:** Compliance Officer
- **Fluxo principal:**
  1. Compliance Officer acessa o módulo de regras.
  2. Cria, edita ou desativa uma regra de conformidade.
  3. Sistema versiona a regra e registra a alteração no log de auditoria.
  4. Regra entra em vigor no próximo ciclo de validação.
- **Pré-condição:** Usuário autenticado com perfil de Compliance Officer.
- **Pós-condição:** Regra versionada e auditada; passa a ser aplicada nos eventos seguintes.

---

### UC04 — Gestão de Usuários e Permissões

- **Ator:** Administrador do Sistema
- **Fluxo principal:**
  1. Administrador acessa o módulo de usuários.
  2. Cria, edita ou desativa um usuário.
  3. Associa o usuário a um perfil (papel).
  4. Sistema registra a ação no log de auditoria.
- **Pré-condição:** Usuário autenticado com perfil de Administrador.
- **Pós-condição:** Usuário criado/alterado; ação auditada.

---

## 6. Restrições e Premissas

### 6.1 Restrições

- O sistema deve estar em conformidade com a **LGPD** (Lei Geral de Proteção de Dados).
- Os logs de auditoria devem ser **imutáveis** — nunca alterados ou excluídos após gravação.
- Toda integração externa deve exigir **autenticação** (API Key, OAuth2 ou similar).
- O banco não relacional utilizado para logs deve garantir **alta disponibilidade e replicação**.

### 6.2 Premissas

- Os sistemas externos (ERPs, CRMs) possuem capacidade de enviar eventos via API REST ou Webhook.
- A equipe terá acesso a ambientes de desenvolvimento, homologação e produção com Docker e Kubernetes disponíveis.
- O sistema será acessado via navegador web (front-end desacoplado).

---

## 7. Riscos Identificados

| ID | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R01 | Integrações com ERPs legados que não suportam Webhooks | Alta | Alto | Desenvolver adaptadores e polling como fallback |
| R02 | Volume elevado de eventos sobrecarregando o Audit Service | Média | Alto | Escalonamento horizontal e filas com backpressure |
| R03 | Complexidade na configuração de regras de compliance | Média | Médio | Interface amigável e suporte a templates de regras |
| R04 | Vazamento de dados sensíveis nos logs | Baixa | Crítico | Criptografia de campos sensíveis e controle rigoroso de acesso |
| R05 | Dificuldade de adoção pelos usuários finais | Média | Médio | Treinamento e UX intuitivo no dashboard |
| R06 | Falha na mensageria (RabbitMQ) causando perda de eventos | Baixa | Alto | Dead-letter queues, retries e persistência de mensagens |

---

## 8. Dependências Técnicas

| Componente | Tecnologia Sugerida | Papel |
|---|---|---|
| Banco Relacional | PostgreSQL | Dados estruturados e críticos |
| Banco Não Relacional | MongoDB | Logs imutáveis e histórico de eventos |
| Mensageria | RabbitMQ | Comunicação assíncrona entre microsserviços |
| Cache | Redis | Performance de consultas frequentes |
| Containerização | Docker | Isolamento de serviços |
| Orquestração | Kubernetes | Auto scaling e gerenciamento de containers |
| Autenticação | JWT / OAuth2 | Segurança de acesso |
| CI/CD | GitHub Actions ou similar | Pipeline de integração e entrega contínua |

---

## 9. Critérios de Aceitação Gerais

- Todos os eventos críticos devem ser registrados no Audit Service em **menos de 2 segundos** após ocorrerem.
- O sistema deve suportar **pelo menos 500 usuários simultâneos** sem degradação de performance.
- O dashboard deve exibir KPIs atualizados com **defasagem máxima de 60 segundos** em relação aos eventos.
- Nenhum log de auditoria deve ser **alterado ou excluído** após gravação.
- Toda violação de compliance deve gerar **alerta automático** ao responsável em menos de 5 minutos.

---

## 10. Referências

- [IdeiaInicial.md](IdeiaInicial.md) — Concepção inicial da plataforma
- [RequisitosCorp.md](RequisitosCorp.md) — Requisitos corporativos detalhados
- [VisaoGeralProjeto.md](VisaoGeralProjeto.md) — Visão geral do sistema
