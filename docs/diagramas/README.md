# Diagramas

Esta pasta contém os diagramas do projeto.

## Entidade-Relacionamento (ER)

- `ERD.puml`: diagrama ER em PlantUML (baseado na seção 3.1.1 do DDE).

## Dicionário de dados

- `DicionarioDeDados.puml`: atributos, tipos, obrigatoriedade e regras de validação (seções 3.1.1 e 3.1.2 do DDE), incluindo PostgreSQL e coleção MongoDB de auditoria.

## Diagrama de sequência

- `DiagramasSequencia.puml`: três fluxos em páginas separadas (`newpage`), conforme seção 3.2.1 do DDE — (1) registro de evento → RabbitMQ → Audit → Compliance → notificação; (2) login com JWT e auditoria; (3) gestão/versionamento de regra de compliance.

## Diagrama de estados

- `DiagramasEstados.puml`: três diagramas de estado no mesmo arquivo (três blocos `@startuml`…`@enduml`), conforme seção 3.2.2 do DDE — **Violação** (Aberta → Em Análise → Resolvida/Dispensada); **RegraCompliance** (Rascunho → Ativa ↔ Inativa); **Usuario** (Ativo ↔ Inativo). Na exportação PNG, costuma gerar um arquivo por diagrama (ex.: `-0`, `-1`, `-2`).

## Diagrama de caso de uso

- `DiagramasCasosDeUso.puml`: atores e casos de uso principais conforme seção 3.3.1 do DDE (Login/Recuperar senha, gestão de usuários, regras, violações, auditoria, dashboard, relatórios, integrações e recebimento de eventos).

## Diagrama de componentes

- `DiagramasComponentes.puml`: componentes do sistema (front-end, microsserviços, RabbitMQ, PostgreSQL, MongoDB e Redis) e dependências principais, conforme seção 3.3.2 do DDE.

## Diagrama de arquitetura

- `DiagramasArquitetura.puml`: visão de arquitetura de alto nível (usuários → front-end → microsserviços, RabbitMQ, PostgreSQL/MongoDB, Redis e integrações ERP/CRM), conforme seções 3.3.3 e 5.1 do DDE.

## Mapeamento Objeto-Relacional (ORM)

- `DiagramasORM.puml`: mapeamento conceitual das entidades do domínio para tabelas do PostgreSQL (estilo JPA/Hibernate), com relacionamentos 1:N, N:N e auto-relacionamento, conforme seção 3.4 do DDE.

## BPMN (Business Process Model and Notation)

- `DiagramasBPMN.puml`: três processos em diagramas de atividade com raias (swimlanes), alinhados à seção 3.5 do DDE — registro e validação de evento; análise de violação; recuperação de senha. Na exportação PNG, costuma gerar um arquivo por diagrama.

