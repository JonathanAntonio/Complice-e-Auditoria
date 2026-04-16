# Checklist de Requisitos — Lista Única

Data: 2026-04-11  
Fonte: consolidação dos checklists gerados nesta sessão.

| ID | Requisito | Status |
|---|---|---|
| RF01 | Cadastro, edição e exclusão de usuários | Parcial |
| RF02 | Controle de perfis e permissões (RBAC) | Completo |
| RF03 | Autenticação segura (JWT/OAuth2) | Completo |
| RF04 | Recuperação de senha | Parcial |
| RF05 | Controle de sessão | Completo |
| RF06 | Autorização por papéis e módulos | Completo |
| RF07 | Logs de acesso | Parcial |
| RF08 | Registro imutável de ações | Parcial |
| RF09 | Histórico de alterações por entidade | Completo |
| RF10 | Versionamento de dados críticos | Parcial |
| RF11 | Dashboard com KPIs | Parcial |
| RF12 | Filtros por período/área/risco | Parcial |
| RF13 | Exportação de relatórios (PDF/CSV) | Parcial |
| RF14 | Atualização dinâmica dos KPIs | Parcial |
| RF15 | Motor de regras de compliance configurável | Parcial |
| RF16 | Geração de violações e pendências | Parcial |
| RF17 | Cálculo de pontuação de risco | Completo |
| RF18 | Integração bidirecional API/Webhook | Parcial |
| RF19 | Alertas automáticos (e-mail/webhook) | Parcial |
| RF20 | ML para padrões suspeitos | Parcial |
| RNF01 | Criptografia de dados sensíveis | Parcial |
| RNF02 | Proteção SQL Injection / XSS | Parcial |
| RNF03 | Rate limiting | Parcial |
| RNF04 | Backup automatizado | Parcial |
| RNF05 | Compliance LGPD | Parcial |
| RNF06 | Assinatura digital de eventos críticos | Parcial |
| RNF07 | Auditoria do próprio sistema | Parcial |
| RNF08 | P95 de APIs críticas < 500ms | Parcial |
| RNF09 | Cache para dados frequentes | Parcial |
| RNF10 | Otimização de consultas | Parcial |
| RNF11 | Processamento assíncrono para carga pesada | Parcial |
| RNF12 | Escalabilidade horizontal | Parcial |
| RNF13 | Arquitetura desacoplada | Completo |
| RNF14 | Alta disponibilidade | Parcial |
| RNF15 | Monitoramento com métricas e alertas | Parcial |
| RNF16 | Failover de infraestrutura crítica | Parcial |
| RNF17 | APIs RESTful padronizadas | Completo |
| RNF18 | Comunicação JSON | Completo |
| RNF19 | Versionamento de API | Completo |
| RN-001 | Acesso exige autenticação | Completo |
| RN-002 | JWT/OAuth2 com expiração | Completo |
| RN-003 | Bloqueio após 5 tentativas inválidas | Parcial |
| RN-004 | Bloqueio gera auditoria/alerta | Parcial |
| RN-005 | Invalidação por inatividade | Completo |
| RN-006 | Sessão simultânea única | Completo |
| RN-007 | Recuperação de senha local | Parcial |
| RN-008 | Login/logout/bloqueio auditados | Parcial |
| RN-010 | Usuário com ao menos um papel | Com`pleto |
| RN-011 | Negação por padrão (RBAC) | Completo |
| RN-012 | Papéis padrão definidos | Completo |
| RN-013 | Só admin gerencia usuários/papéis | Completo |
| RN-014 | Auditor externo só leitura/escopo | Parcial |
| RN-015 | Só Compliance Officer gerencia regras | Parcial |
| RN-016 | Alteração de permissões auditada | Parcial |
| RN-017 | Usuário inativo não autentica | Completo |
| RN-020 | Todo evento relevante auditado | Parcial |
| RN-021 | Log de auditoria imutável | Parcial |
| RN-022 | Campos mínimos no log | Parcial |
| RN-023 | Auditoria antes da efetivação | Parcial |
| RN-024 | Evento externo identifica origem | Parcial |
| RN-025 | Mascaramento/criptografia de sensíveis no log | Parcial |
| RN-026 | Histórico cronológico por entidade | Parcial |
| RN-027 | Audit service também auditado | Parcial |
| RN-030 | Regra com campos obrigatórios | Parcial |
| RN-031 | Regra só vale quando ativa | Parcial |
| RN-032 | Edição de regra ativa cria versão | Parcial |
| RN-033 | Desativação de regra com justificativa | Parcial |
| RN-034 | Aplicar todas regras ativas compatíveis | Parcial |
| RN-035 | Violação criada com status Aberta | Completo |
| RN-036 | Transições de status auditadas | Parcial |
| RN-037 | Dispensa só por Compliance Officer com justificativa | Parcial |
| RN-038 | Crítica exige aprovação dupla para dispensa | Parcial |
| RN-039 | SLA para iniciar análise por severidade | Parcial |
| RN-040 | Score de risco por usuário/área/processo | Completo |
| RN-041 | Faixas Baixo/Médio/Alto/Crítico | Completo |
| RN-042 | Recalcular score a cada evento relevante | Completo |
| RN-043 | Alerta se área crítica >24h | Parcial |
| RN-044 | Score não editável manualmente | Completo |
| RN-045 | Histórico de score para tendências | Completo |
| RN-050 | Toda violação gera notificação | Parcial |
| RN-051 | Crítica notificada em até 5 minutos | Parcial |
| RN-052 | Canais mínimos email/webhook | Completo |
| RN-053 | Destinatário por perfil/estrutura organizacional | Parcial |
| RN-054 | Reprocessar até 3x e dead-letter | Completo |
| RN-055 | Log de envio por status | Parcial |
| RN-056 | Preferências de notificação do usuário | Parcial |
| RN-060 | Dashboard por escopo de acesso | Parcial |
| RN-061 | KPIs com defasagem máxima de 60s | Parcial |
| RN-062 | Fórmula do índice de conformidade | Parcial |
| RN-063 | Filtros completos no dashboard | Parcial |
| RN-064 | Exportação auditada (quem/quando/filtros/formato) | Parcial |
| RN-065 | Rodapé com metadados no relatório | Completo |
| RN-070 | Integração externa autenticada | Parcial |
| RN-071 | Sem auth válida retorna 401 e não processa | Parcial |
| RN-072 | Validar estrutura/conteúdo de evento externo | Parcial |
| RN-073 | Idempotência de eventos | Parcial |
| RN-074 | Registrar chamadas de integração entrada/saída | Parcial |
| RN-075 | Timeout + retry com backoff + DLQ | Parcial |
| RN-076 | Mudança de integração auditada | Parcial |
| RN-080 | Retenção mínima de 5 anos (auditoria) | Completo |
| RN-081 | Anonimização após 2 anos inativo | Completo |
| RN-082 | Violações resolvidas/dispensadas por 5 anos | Completo |
| RN-083 | Política de retenção configurável | Completo |
| RN-084 | Solicitação de exclusão/anonimização auditada | Parcial |
| RN-090 | Dados obrigatórios de usuário | Parcial |
| RN-091 | E-mail corporativo único | Completo |
| RN-092 | Exclusão lógica de usuário | Completo |
| RN-093 | E-mail de boas-vindas ao criar usuário | Parcial |
| RN-094 | Desativação encerra sessões ativas | Parcial |
| RN-095 | Impedir auto-desativação do último admin | Parcial |
| RN-100 | Escritas transacionais | Parcial |
| RN-101 | Nenhuma escrita sem auditoria | Parcial |
| RN-102 | Sem audit service, suspender processamento | Parcial |
| RN-103 | Operar em UTC | Completo |
| RN-104 | Campos obrigatórios bloqueiam operação | Parcial |
| RN-105 | Não expor erro técnico ao usuário final | Completo |
