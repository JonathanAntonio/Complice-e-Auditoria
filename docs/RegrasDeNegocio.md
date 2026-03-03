# Regras de Negócio — Sistema Corporativo de Compliance e Auditoria

## 1. Introdução

Este documento define as **regras de negócio** que governam o comportamento do Sistema Corporativo de Compliance e Auditoria. Cada regra possui um identificador único (`RN-XXX`) para facilitar rastreamento, referência em código e testes.

As regras estão organizadas por domínio funcional do sistema.

---

## 2. Autenticação e Sessão

| ID | Regra |
|---|---|
| RN-001 | Todo acesso ao sistema exige autenticação prévia. Usuários não autenticados não podem acessar nenhum recurso além da tela de login e recuperação de senha. |
| RN-002 | A autenticação deve utilizar JWT ou OAuth2. Tokens devem ter tempo de expiração configurável pelo administrador. |
| RN-003 | Após **5 tentativas de login inválidas consecutivas**, a conta do usuário deve ser bloqueada temporariamente por no mínimo 15 minutos. |
| RN-004 | O bloqueio de conta por tentativas inválidas deve gerar um **registro de auditoria** e, se configurado, um alerta ao administrador. |
| RN-005 | A sessão do usuário deve ser invalidada automaticamente após o tempo de inatividade configurado, exigindo novo login. |
| RN-006 | Não é permitido mais de uma sessão ativa simultânea para o mesmo usuário, salvo configuração explícita do administrador. |
| RN-007 | A recuperação de senha deve ocorrer exclusivamente por canal seguro (e-mail com link de uso único e expiração de 30 minutos). |
| RN-008 | Toda ação de login, logout, bloqueio e recuperação de senha deve ser registrada no log de auditoria. |

---

## 3. Controle de Acesso e Perfis (RBAC)

| ID | Regra |
|---|---|
| RN-010 | Todo usuário deve estar associado a **pelo menos um perfil (papel)**. Não é permitido usuário sem papel definido. |
| RN-011 | O acesso a módulos e funcionalidades é determinado exclusivamente pelo papel do usuário. Acesso não concedido explicitamente é negado por padrão. |
| RN-012 | Os papéis padrão do sistema são: **Administrador**, **Compliance Officer**, **Auditor Interno**, **Auditor Externo**, **Gestor** e **Visualizador**. |
| RN-013 | Somente o **Administrador** pode criar, editar, desativar usuários e alterar atribuições de papéis. |
| RN-014 | O **Auditor Externo** tem acesso somente leitura e restrito ao escopo de auditoria definido para ele. Não pode exportar dados fora desse escopo. |
| RN-015 | O **Compliance Officer** é o único papel autorizado a criar, editar e desativar regras de compliance. |
| RN-016 | A alteração de permissões de um papel existente deve ser registrada no log de auditoria com identificação de quem realizou a mudança. |
| RN-017 | Usuários inativos não podem autenticar no sistema. O acesso deve ser bloqueado imediatamente após a desativação. |

**Matriz de Acesso por Módulo:**

| Módulo | Administrador | Compliance Officer | Auditor Interno | Auditor Externo | Gestor | Visualizador |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Gestão de Usuários | ✔ | — | — | — | — | — |
| Regras de Compliance | Leitura | ✔ | Leitura | Leitura | Leitura | — |
| Logs de Auditoria | ✔ | ✔ | ✔ | Escopo | Leitura | — |
| Dashboard / KPIs | ✔ | ✔ | ✔ | Escopo | ✔ | ✔ |
| Relatórios | ✔ | ✔ | ✔ | Escopo | ✔ | — |
| Violações | ✔ | ✔ | ✔ | Leitura | Leitura | — |
| Configurações do Sistema | ✔ | — | — | — | — | — |
| Integrações Externas | ✔ | Leitura | — | — | — | — |

---

## 4. Auditoria e Rastreamento

| ID | Regra |
|---|---|
| RN-020 | **Todo evento relevante** do sistema deve ser registrado no Audit Service, incluindo: criação, edição, exclusão, aprovação, rejeição, login, logout e acesso a dados sensíveis. |
| RN-021 | Os logs de auditoria são **imutáveis**. Nenhum usuário, processo ou integração pode alterar ou excluir um registro de auditoria após sua gravação. |
| RN-022 | Cada registro de auditoria deve conter obrigatoriamente: **ID do evento**, **timestamp (UTC)**, **ID do usuário ou sistema**, **ação realizada**, **entidade afetada**, **valor anterior** (quando aplicável), **valor novo** (quando aplicável) e **endereço IP de origem**. |
| RN-023 | O registro de auditoria deve ser gravado **antes** da ação ser efetivada no sistema, garantindo rastreabilidade mesmo em caso de falha. |
| RN-024 | Eventos originados de integrações externas (ERPs, CRMs) devem identificar o sistema de origem no registro de auditoria. |
| RN-025 | Dados sensíveis presentes nos logs (ex.: CPF, dados bancários) devem ser **mascarados ou criptografados** no armazenamento. |
| RN-026 | O histórico de alterações de uma entidade de negócio (ex.: contrato, regra) deve ser acessível a usuários com permissão, com ordenação cronológica e identificação do responsável por cada versão. |
| RN-027 | O próprio sistema de auditoria está sujeito a auditoria: ações administrativas sobre o Audit Service também devem ser registradas. |

---

## 5. Compliance e Validação de Regras

| ID | Regra |
|---|---|
| RN-030 | Toda regra de compliance deve ter: **nome**, **descrição**, **critério de disparo**, **nível de severidade** (Baixo, Médio, Alto, Crítico), **status** (Ativa/Inativa) e **data de vigência**. |
| RN-031 | Uma regra de compliance somente entra em vigor após ser **ativada** por um Compliance Officer. Regras inativas não são aplicadas aos eventos. |
| RN-032 | A edição de uma regra ativa deve criar uma **nova versão** da regra. A versão anterior deve ser mantida no histórico para fins de auditoria. |
| RN-033 | A desativação de uma regra deve ser registrada em auditoria com justificativa obrigatória. |
| RN-034 | Ao receber um evento, o Compliance Engine deve aplicar **todas as regras ativas** compatíveis com o tipo do evento. |
| RN-035 | Quando um evento viola uma regra, o sistema deve gerar automaticamente uma **violação** com: ID, referência ao evento, referência à regra violada, severidade, timestamp e status inicial `Aberta`. |
| RN-036 | Uma violação pode ter os seguintes status: `Aberta`, `Em Análise`, `Resolvida` ou `Dispensada`. A transição de status deve ser registrada em auditoria. |
| RN-037 | Somente o **Compliance Officer** pode dispensar (`Dispensar`) uma violação, com justificativa obrigatória. |
| RN-038 | Violações com severidade **Crítica** não podem ser dispensadas sem aprovação dupla (Compliance Officer + aprovador designado). |
| RN-039 | O tempo máximo para iniciar a análise de uma violação é determinado pela severidade: Crítica = 1h, Alta = 4h, Média = 24h, Baixa = 72h. |

---

## 6. Análise e Pontuação de Risco

| ID | Regra |
|---|---|
| RN-040 | O sistema deve calcular uma **pontuação de risco** para cada usuário, área organizacional e tipo de processo, com base no histórico de violações, frequência de eventos e criticidade. |
| RN-041 | A pontuação de risco deve ser classificada em quatro níveis: **Baixo** (0–24), **Médio** (25–49), **Alto** (50–74), **Crítico** (75–100). |
| RN-042 | A pontuação de risco deve ser **recalculada automaticamente** sempre que um novo evento relevante for processado. |
| RN-043 | Uma área organizacional com risco **Crítico** por mais de 24 horas consecutivas deve gerar um alerta automático para a Diretoria e o Compliance Officer. |
| RN-044 | A pontuação de risco não pode ser alterada manualmente. Ela é calculada exclusivamente pelo Risk Analysis Service com base em regras configuráveis. |
| RN-045 | O histórico de pontuações de risco deve ser mantido para análise de tendências e geração de relatórios. |

---

## 7. Notificações e Alertas

| ID | Regra |
|---|---|
| RN-050 | Toda violação gerada deve disparar automaticamente uma notificação ao responsável pelo escopo afetado (área, processo ou usuário). |
| RN-051 | As notificações de violações críticas devem ser enviadas ao **Compliance Officer** e ao **gestor responsável pela área** no prazo máximo de 5 minutos após a detecção. |
| RN-052 | O sistema deve suportar ao menos os canais de notificação: **e-mail** e **webhook**. Canais adicionais podem ser configurados pelo administrador. |
| RN-053 | O destinatário das notificações é determinado pelo perfil e pela estrutura organizacional do usuário ou área afetada. |
| RN-054 | Notificações não entregues devem ser **reprocessadas automaticamente** com até 3 tentativas antes de serem movidas para a fila de falhas (dead-letter). |
| RN-055 | O envio de cada notificação deve ser registrado no log de auditoria com status de entrega (Enviada, Falha, Reprocessando). |
| RN-056 | O usuário pode configurar preferências de notificação (canal, frequência, agrupamento), desde que não desative alertas de severidade Alta ou Crítica. |

---

## 8. Dashboard e KPIs

| ID | Regra |
|---|---|
| RN-060 | O dashboard deve exibir apenas os dados **pertinentes ao escopo de acesso** do usuário autenticado (conforme papel e área organizacional). |
| RN-061 | Os KPIs exibidos no dashboard devem ser atualizados com defasagem máxima de **60 segundos** em relação aos eventos processados. |
| RN-062 | O índice de conformidade (%) deve ser calculado como: `(eventos conformes / total de eventos validados) × 100`, no período selecionado. |
| RN-063 | O dashboard deve permitir filtros por: **período**, **área organizacional**, **tipo de evento**, **nível de risco** e **status de violação**. |
| RN-064 | A exportação de relatórios a partir do dashboard deve ser registrada em auditoria (quem exportou, quando, filtros aplicados e formato). |
| RN-065 | Relatórios exportados devem incluir rodapé com: data de geração, usuário responsável e período de referência dos dados. |

---

## 9. Integração com Sistemas Externos

| ID | Regra |
|---|---|
| RN-070 | Toda integração com sistema externo deve ser **autenticada** via API Key, OAuth2 ou mecanismo equivalente aprovado pelo administrador. |
| RN-071 | Sistemas externos sem autenticação válida devem ter suas requisições rejeitadas com status `401 Unauthorized`, sem processamento do evento. |
| RN-072 | Cada evento recebido via integração deve ser **validado** quanto à estrutura e conteúdo antes de ser aceito. Eventos inválidos devem ser rejeitados com detalhamento do erro e registrados no log de integração. |
| RN-073 | O sistema deve garantir **idempotência** no processamento de eventos: o mesmo evento recebido mais de uma vez não deve gerar duplicatas de auditoria ou violação. |
| RN-074 | Todas as chamadas de integração (entrada e saída) devem ser registradas com: timestamp, sistema de origem/destino, payload resumido, status de processamento e tempo de resposta. |
| RN-075 | Integrações de saída devem respeitar **timeout configurável**. Em caso de falha, o sistema deve realizar até 3 retentativas com backoff exponencial antes de mover para dead-letter. |
| RN-076 | A adição, edição ou remoção de uma integração configurada deve ser registrada em auditoria com identificação do administrador responsável. |

---

## 10. Retenção e Ciclo de Vida dos Dados

| ID | Regra |
|---|---|
| RN-080 | Os logs de auditoria devem ser retidos por **no mínimo 5 anos**, em conformidade com obrigações legais e regulatórias (LGPD, SOX, ISO, etc.). |
| RN-081 | Dados pessoais de usuários inativos devem ser anonimizados após **2 anos** da desativação, salvo obrigação legal de retenção. |
| RN-082 | Violações resolvidas ou dispensadas devem ser mantidas no histórico por **no mínimo 5 anos** e nunca excluídas permanentemente. |
| RN-083 | A política de retenção de dados deve ser configurável pelo administrador dentro dos limites mínimos estabelecidos neste documento. |
| RN-084 | Qualquer solicitação de exclusão ou anonimização de dados deve ser registrada em auditoria, incluindo o motivo e a autorização. |

---

## 11. Gestão de Usuários

| ID | Regra |
|---|---|
| RN-090 | Todo usuário deve ter os seguintes dados obrigatórios: **nome completo**, **e-mail corporativo único**, **papel**, **área organizacional** e **status** (Ativo/Inativo). |
| RN-091 | O e-mail corporativo é o identificador único do usuário no sistema. Não é permitido cadastrar dois usuários com o mesmo e-mail. |
| RN-092 | A exclusão de usuários é **lógica** (inativação). Usuários não podem ser removidos permanentemente do banco para preservar o histórico de auditoria. |
| RN-093 | A criação de um novo usuário deve disparar um e-mail de boas-vindas com instruções para definição de senha. |
| RN-094 | Ao desativar um usuário, todas as suas sessões ativas devem ser encerradas imediatamente. |
| RN-095 | O administrador não pode desativar a própria conta enquanto for o único administrador ativo no sistema. |

---

## 12. Regras Gerais do Sistema

| ID | Regra |
|---|---|
| RN-100 | Todas as operações de escrita no sistema devem ser **transacionais**. Em caso de falha parcial, a operação deve ser revertida por completo. |
| RN-101 | Nenhuma operação interna do sistema pode bypassar o registro de auditoria, inclusive operações automatizadas e jobs em background. |
| RN-102 | Em caso de indisponibilidade do Audit Service, o processamento de eventos deve ser **suspenso** — não é permitido processar eventos sem garantia de registro de auditoria. |
| RN-103 | O sistema deve operar em **UTC** para todos os timestamps. A exibição no front-end deve converter para o fuso horário configurado pelo usuário. |
| RN-104 | Campos obrigatórios não preenchidos devem impedir o prosseguimento da operação, com mensagem de erro clara e específica. |
| RN-105 | O sistema não deve expor mensagens de erro técnicas (stack traces, queries SQL) para o usuário final. Erros devem ser registrados internamente e exibidos de forma genérica ao usuário. |

---

## 13. Referências

- [IdeiaInicial.md](IdeiaInicial.md) — Concepção inicial da plataforma
- [RequisitosCorp.md](RequisitosCorp.md) — Requisitos corporativos detalhados
- [VisaoGeralProjeto.md](VisaoGeralProjeto.md) — Visão geral do sistema
- [AnaliseRequisitos.md](AnaliseRequisitos.md) — Análise de requisitos funcionais e não funcionais
