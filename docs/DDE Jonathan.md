# 

**![][image1]AUTARQUIA DE ENSINO SUPERIOR DE ARCOVERDE**  
**CENTRO DE ENSINO SUPERIOR DE ARCOVERDE**  
**CURSO SUPERIOR EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS**

**COMPLICE E AUDITORIA**  
---

*Relatório Técnico* 

JONATHAN BRITO

ARCOVERDE \- PE  
2026  
**JONATHAN BRITO**

**COMPLICE E AUDITORIA**

Relatório Técnico apresentado como requisito parcial para a disciplina de Projeto de Desenvolvimento de Sistemas Web / Projeto de Desenvolvimento de Sistema Corporativo, do curso superior em Análise em Desenvolvimento de Sistemas, sob orientação do Profº Dennys Cavalcanti Carvalho.

ARCOVERDE \- PE  
2026  
**HISTÓRICO DE REVISÃO**

| Data | Versão | Descrição |
| :---: | :---: | ----- |
| 05/02/2026 | 1.0 | Elaboração dos primeiros conteúdos para implementação no documento. |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**SUMÁRIO**

**[1 DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)	6](#1-documento-de-definição-de-escopo-\(dde\))**

[1.1. INTRODUÇÃO	6](#1.1-introdução-o-sistema-corporativo-de-compliance-e-auditoria-é-uma-plataforma-voltada-ao-setor-corporativo,-em-especial-a-empresas-de-médio-e-grande-porte-que-precisam-de-rastreamento-detalhado-de-ações-internas,-evidência-de-conformidade-regulatória-e-redução-de-riscos-operacionais-e-de-fraude.-o-software-se-destina-a-áreas-como-diretoria,-compliance,-jurídico-e-auditoria-\(interna-e-externa\),-oferecendo-centralização-de-auditoria-de-eventos,-monitoramento-de-conformidade,-análise-de-risco-e-relatórios-regulatórios-em-uma-única-solução.)

[1.2. VISÃO GERAL DO DOCUMENTO	6](#1.2-visão-geral-do-documento)

[1.3. IDENTIFICAÇÃO DO PROJETO	6](#1.3-identificação-do-projeto)

[1.4. OBJETIVOS DO PROJETO	6](#1.4-objetivos-do-projeto-objetivo-geral:-desenvolver-um-sistema-corporativo-de-compliance-e-auditoria-para-centralizar-o-rastreamento-de-eventos,-o-monitoramento-de-conformidade-regulatória-e-a-análise-de-risco-em-empresas-de-médio-e-grande-porte,-atendendo-diretoria,-área-de-compliance,-jurídico-e-auditores-internos-e-externos.)

[1.5. JUSTIFICATIVA	7](#1.5-justificativa)

[1.6. IDENTIFICAÇÃO DOS REQUISITOS	7](#1.6-identificação-dos-requisitos)

[**1.6.1. Prioridades dos Requisitos	7**](#1.6.1-prioridades-dos-requisitos)

[1.7. ESCOPO DO PRODUTO E ENTREGÁVEIS	8](#1.7-escopo-do-produto-e-entregáveis)

[**1.7.1. Funcionalidades Previstas	8**](#1.7.1-funcionalidades-previstas)

[**1.7.2. Entregáveis	8**](#1.7.2-entregáveis)

[1.8. PREMISSAS E RESTRIÇÕES	8](#1.8-premissas-e-restrições)

[**1.8.1. Premissas	8**](#1.8.1-premissas)

[**1.8.2. Restrições	8**](#1.8.2-restrições)

[1.9. CRITÉRIOS DE ACEITAÇÃO DO PROJETO	9](#1.9-critérios-de-aceitação-do-projeto)

[1.10. EXCLUSÕES DO ESCOPO	9](#1.10-exclusões-do-escopo)

[1.11. STAKEHOLDERS ENVOLVIDOS	9](#1.11-stakeholders-envolvidos)

[1.12. RISCOS INICIAIS	9](#1.12-riscos-iniciais)

[**2 DOCUMENTO DE ESPECIFICAÇÃO DE REQUISITOS (ERS)	11**](#2-documento-de-especificação-de-requisitos-\(ers\))

[2.1. REQUISITOS FUNCIONAIS	11](#2.1-requisitos-funcionais)

[2.2. REQUISITOS NÃO FUNCIONAIS	11](#2.2-requisitos-não-funcionais)

[2.3. REGRAS DE NEGÓCIO	11](#2.3-regras-de-negócio)

[**3 DOCUMENTO DE ESPECIFICAÇÃO DE MODELAGEM (DEM)	13**](#3-documento-de-especificação-de-modelagem-\(dem\))

[3.1 MODELAGEM DE DADOS	13](#3.1-modelagem-de-dados)

[**3.1.1 Entidade-Relacionamento	13**](#3.1.1-entidade-relacionamento)

[**3.1.2 Dicionário de Dados	13**](#3.1.2-dicionário-de-dados)

[3.2 MODELAGEM COMPORTAMENTAL	13](#3.2-modelagem-comportamental)

[**3.2.1 Diagrama de Sequência	13**](#3.2.1-diagrama-de-sequência)

[**3.2.2 Diagrama de Estados	13**](#3.2.2-diagrama-de-estados)

[3.3. MODELAGEM ESTRUTURAL	13](#3.3-modelagem-estrutural)

[**3.3.1 Diagrama de Caso de Uso	13**](#3.3.1-diagrama-de-caso-de-uso)

[**3.3.2 Diagrama de Componentes	13**](#3.3.2-diagrama-de-componentes)

[**3.3.3 Diagrama de Arquitetura	13**](#3.3.3-diagrama-de-arquitetura)

[3.4 MAPEAMENTO OBJETO-RELACIONAL (ORM)	13](#3.4-mapeamento-objeto-relacional-\(orm\))

[3.5 BPMN (BUSINESS PROCESS MODEL AND NOTATION)	13](#3.5-bpmn-\(business-process-model-and-notation\))

[**4 DOCUMENTO DE ESPECIFICAÇÃO DE INTERFACES (DEI)	14**](#4-documento-de-especificação-de-interfaces-\(dei\))

[4.1. WIREFRAMES	14](#4.1-wireframes)

[4.2. MOCKUPS	14](#4.2-mockups)

[4.3. FLUXO DE NAVEGAÇÃO	14](#4.3-fluxo-de-navegação)

[**5 DOCUMENTAÇÃO TÉCNICA	15**](#5-documentação-técnica)

[5.1. ARQUITETURA DO SISTEMA	15](#5.1-arquitetura-do-sistema)

[**5.1.1. Segmentação da Arquitetura	15**](#5.1.1-segmentação-da-arquitetura)

[5.2. TECNOLOGIAS UTILIZADAS	15](#5.2-tecnologias-utilizadas)

[**5.2.1 Frontend	15**](#5.2.1-frontend)

[**5.2.2. Backend	15**](#5.2.2-backend)

[**5.2.3. Banco de Dados	15**](#5.2.3-banco-de-dados)

[**5.2.4. Ferramentas de Apoio	15**](#5.2.4-ferramentas-de-apoio)

[**5.2.5. Padrões Adotados	15**](#5.2.5-padrões-adotados)

[**5.2.6. Boas Práticas e Convenções	16**](#5.2.6-boas-práticas-e-convenções)

[**5.2.7. Requisitos de Infraestrutura	17**](#5.2.7-requisitos-de-infraestrutura)

[**5.2.8. APIs e Integrações	17**](#5.2.8-apis-e-integrações)

[**5.2.9. Caracterização da API	17**](#5.2.9-caracterização-da-api)

[5.3. REPOSITÓRIO E CÓDIGO-FONTE	17](#5.3-repositório-e-código-fonte)

[**6\. MANUAL DO USUÁRIO	18**](#6-manual-do-usuário)

[**7\. REFERÊNCIAS	20**](#7.-referências)

[**8\. APÊNDICE	21**](#8.-apêndice)

# 

# **1 DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)** {#1-documento-de-definição-de-escopo-(dde)}

## 

## 1.1 INTRODUÇÃO O Sistema Corporativo de Compliance e Auditoria é uma plataforma voltada ao setor corporativo, em especial a empresas de médio e grande porte que precisam de rastreamento detalhado de ações internas, evidência de conformidade regulatória e redução de riscos operacionais e de fraude. O software se destina a áreas como diretoria, compliance, jurídico e auditoria (interna e externa), oferecendo centralização de auditoria de eventos, monitoramento de conformidade, análise de risco e relatórios regulatórios em uma única solução. {#1.1-introdução-o-sistema-corporativo-de-compliance-e-auditoria-é-uma-plataforma-voltada-ao-setor-corporativo,-em-especial-a-empresas-de-médio-e-grande-porte-que-precisam-de-rastreamento-detalhado-de-ações-internas,-evidência-de-conformidade-regulatória-e-redução-de-riscos-operacionais-e-de-fraude.-o-software-se-destina-a-áreas-como-diretoria,-compliance,-jurídico-e-auditoria-(interna-e-externa),-oferecendo-centralização-de-auditoria-de-eventos,-monitoramento-de-conformidade,-análise-de-risco-e-relatórios-regulatórios-em-uma-única-solução.}

## 

## A ideia central é unificar, em uma única plataforma, a auditoria de eventos, o monitoramento de conformidade (incluindo LGPD, ISO, SOX e normativos internos), a análise e pontuação de risco e a geração de relatórios regulatórios, com alto nível de segurança, rastreabilidade e escalabilidade. Assim, o sistema busca atender empresas com forte exigência de compliance e auditoria, reduzindo a falta de rastreabilidade, as auditorias manuais e demoradas e os riscos de não conformidade e fraude.

## 

## 1.2 VISÃO GERAL DO DOCUMENTO {#1.2-visão-geral-do-documento}

Este documento apresenta o escopo detalhado do Sistema Corporativo de Compliance e Auditoria, uma plataforma corporativa destinada a empresas de médio e grande porte que necessitam de rastreamento de ações internas, comprovação de conformidade regulatória e redução de riscos operacionais e de fraude. Ao longo do documento são descritos os objetivos do sistema, o público-alvo (diretoria, compliance, jurídico e auditores internos e externos), a arquitetura de alto nível, os requisitos funcionais e não funcionais, as regras de negócio e os aspectos de segurança, integração e infraestrutura que compõem o projeto.

## 

## 1.3 IDENTIFICAÇÃO DO PROJETO  {#1.3-identificação-do-projeto}

Nome do Projeto: Complice e Auditoria  
Autor: Jonathan Brito

## 

## 1.4 OBJETIVOS DO PROJETO  Objetivo Geral: Desenvolver um sistema corporativo de compliance e auditoria para centralizar o rastreamento de eventos, o monitoramento de conformidade regulatória e a análise de risco em empresas de médio e grande porte, atendendo diretoria, área de compliance, jurídico e auditores internos e externos. {#1.4-objetivos-do-projeto-objetivo-geral:-desenvolver-um-sistema-corporativo-de-compliance-e-auditoria-para-centralizar-o-rastreamento-de-eventos,-o-monitoramento-de-conformidade-regulatória-e-a-análise-de-risco-em-empresas-de-médio-e-grande-porte,-atendendo-diretoria,-área-de-compliance,-jurídico-e-auditores-internos-e-externos.}

Objetivos Específicos: 

* Levantar e documentar os requisitos funcionais e não funcionais do sistema, alinhados a normas como LGPD, ISO e SOX.  
* Projetar a arquitetura do sistema em microsserviços orientada a eventos, com uso de mensageria (RabbitMQ) e integração com sistemas legados.  
* Implementar o Audit Service para registro imutável de eventos em banco não relacional, garantindo rastreabilidade e trilha de auditoria.  
* Implementar o Compliance Engine com motor de regras configurável para validação de eventos e geração automática de violações.  
* Implementar o Risk Analysis Service para cálculo e atualização de pontuação de risco por usuário, área e processo.  
* Implementar o Reporting Service para geração de relatórios regulatórios e operacionais e suporte a dashboards com KPIs.  
* Implementar o Integration Service para recebimento e envio de eventos via API e webhooks com ERPs e sistemas externos.  
* Implementar o Notification Service para envio de alertas (e-mail, webhook) em caso de violações e eventos críticos.  
* Definir e aplicar controle de acesso baseado em papéis (RBAC) e autenticação segura (JWT ou OAuth2).  
* Garantir segurança, criptografia de dados sensíveis e conformidade com LGPD nas operações do sistema.  
* Validar a solução por meio de testes unitários, de integração e de carga nos serviços críticos.

## 1.5 JUSTIFICATIVA {#1.5-justificativa}

Empresas de médio e grande porte sofrem com falta de rastreabilidade, dificuldade em comprovar conformidade (LGPD, ISO, SOX) e exposição a fraudes. No Brasil, 63% das empresas registraram ao menos uma fraude nos últimos 12 meses (Grant Thornton, 2024), e a ACFE (2024) estima que organizações percam cerca de 5% da receita anual com fraude ocupacional. Auditorias manuais consomem tempo e equipe, e a maturidade de compliance no país ainda é moderada (KPMG, 2024). Continuar assim aumenta custo operacional, risco reputacional e dificuldade em comprovar conformidade.

O sistema centraliza auditoria de eventos (registro imutável), regras de conformidade, análise de risco e relatórios em uma única plataforma integrada a ERPs. A automatização reduz trabalho manual e dá visibilidade contínua, diminuindo a “oportunidade” de fraude (Grant Thornton, 2024\) e permitindo resposta rápida a reguladores. Vale a pena desenvolver porque concentra evidências de conformidade, acelera auditorias e reduz dependência de processos manuais e fragmentados.

## 1.6 IDENTIFICAÇÃO DOS REQUISITOS  {#1.6-identificação-dos-requisitos}

Por convenção, os requisitos são referenciados pelo nome da subseção onde estão descritos, seguido do seu identificador, conforme o esquema abaixo:

* O requisito funcional \[Cadastro de Usuários.RF-01\] está localizado na subseção “Requisitos Funcionais”, dentro do bloco identificado como \[RF-01\].

* O requisito não funcional \[Disponibilidade.NF-04\] encontra-se na seção “Requisitos Não Funcionais de Confiabilidade”, no bloco identificado como \[NF-04\].

### **1.6.1 Prioridades dos Requisitos** {#1.6.1-prioridades-dos-requisitos}

Os requisitos do sistema são classificados em três níveis de prioridade:

* **Essencial:** indispensável para o funcionamento do sistema. Sem ele, o sistema não opera. Deve ser obrigatoriamente implementado.

* **Importante:** afeta a qualidade do funcionamento. O sistema pode ser utilizado sem esse requisito, mas de forma insatisfatória. Sua implementação é recomendada.

* **Desejável:** não interfere nas funcionalidades básicas. O sistema funciona bem sem ele. Pode ser incluído em versões futuras, caso não haja tempo para implementá-lo na versão atual.

## 1.7 ESCOPO DO PRODUTO E ENTREGÁVEIS  {#1.7-escopo-do-produto-e-entregáveis}

### **1.7.1 Funcionalidades Previstas** {#1.7.1-funcionalidades-previstas}

* **Gestão de Usuários:** Cadastro, edição e exclusão lógica de usuários; controle de perfis e permissões (RBAC); autenticação segura (JWT ou OAuth2); recuperação de senha; controle de sessão com expiração configurável.
* **Controle de Acesso:** Autorização por papéis e por módulo; logs de acesso (login, logout, tentativas inválidas).
* **Auditoria e Rastreamento:** Registro imutável de ações dos usuários no Audit Service; histórico de alterações por entidade; versionamento de dados críticos; persistência em banco não relacional.
* **Compliance Engine:** Motor de regras de compliance configurável; validação de eventos conforme normativos; geração automática de violações e pendências.
* **Análise de Risco:** Cálculo e atualização de pontuação de risco por usuário, área e processo (Risk Analysis Service).
* **Dashboard e KPIs:** Visualização de métricas estratégicas e operacionais; filtros por período, área e nível de risco; atualização dinâmica dos indicadores; exportação de relatórios (PDF, CSV).
* **Reporting Service:** Geração de relatórios regulatórios e operacionais; suporte a dashboards com KPIs.
* **Integration Service:** Recebimento e envio de eventos via API e webhooks com ERPs e sistemas externos; validação e idempotência.
* **Notification Service:** Envio de alertas (e-mail, webhook) em caso de violações e eventos críticos; reprocessamento e dead-letter para falhas.

### **1.7.2 Entregáveis** {#1.7.2-entregáveis}

* Código-fonte do projeto no repositório (GitHub), incluindo front-end, back-end e configurações de infraestrutura (Docker, quando aplicável).
* Documento de Definição de Escopo (DDE) e Documento de Especificação de Requisitos (ERS).
* Documentação de arquitetura e modelagem (DEM), incluindo diagramas de alto nível.
* Documentação de interfaces (DEI), com wireframes e fluxo de navegação quando disponíveis.
* Documentação técnica (arquitetura, tecnologias, padrões, estrutura do repositório).
* Manual do Usuário com passo a passo e glossário de mensagens.
* Referências e Apêndice com materiais complementares.

## 1.8 PREMISSAS E RESTRIÇÕES {#1.8-premissas-e-restrições}

### **1.8.1 Premissas**  {#1.8.1-premissas}

* Os usuários (diretoria, compliance, jurídico, auditores) terão acesso à internet e dispositivos compatíveis para acessar a plataforma web.
* Os sistemas externos (ERPs, CRMs) possuem capacidade de enviar eventos via API REST ou Webhook.
* A equipe terá acesso a ambientes de desenvolvimento, homologação e produção, com Docker e ferramentas de orquestração disponíveis quando necessário.
* O sistema será acessado prioritariamente via navegador web (front-end desacoplado).
* Haverá interesse das áreas de compliance e auditoria em utilizar uma plataforma centralizada para rastreamento e conformidade.
* Os normativos (LGPD, ISO, SOX e internos) são conhecidos e passíveis de modelagem em regras no Compliance Engine.

### **1.8.2 Restrições**  {#1.8.2-restrições}

* O projeto deve ser concluído dentro do prazo da disciplina.
* O sistema será inicialmente apenas web (sem aplicativo nativo mobile).
* O sistema deve estar em conformidade com a LGPD; os logs de auditoria devem ser imutáveis; integrações externas devem exigir autenticação (API Key, OAuth2 ou similar).
* O banco não relacional utilizado para logs deve garantir alta disponibilidade e replicação quando em produção.
* Tecnologias alinhadas à arquitetura definida: front-end desacoplado (ex.: React), back-end em microsserviços (ex.: Java/Spring Boot ou stack definida), PostgreSQL, MongoDB, RabbitMQ e Redis conforme documentação de arquitetura.

## 1.9 CRITÉRIOS DE ACEITAÇÃO DO PROJETO {#1.9-critérios-de-aceitação-do-projeto}

* Todos os eventos críticos devem ser registrados no Audit Service em **menos de 2 segundos** após ocorrerem.
* O sistema deve suportar **pelo menos 500 usuários simultâneos** sem degradação significativa de performance (conforme requisitos não funcionais).
* O dashboard deve exibir KPIs atualizados com **defasagem máxima de 60 segundos** em relação aos eventos processados.
* Nenhum log de auditoria deve ser **alterado ou excluído** após gravação (imutabilidade).
* Toda violação de compliance deve gerar **alerta automático** ao responsável em menos de 5 minutos (para severidade crítica).
* Tempo de resposta P95 das APIs críticas **inferior a 500 ms** para operações síncronas.
* Cobertura mínima de testes (unitários e de integração) nos serviços críticos, conforme definição da equipe.
* Interface funcional para os fluxos principais: login, gestão de usuários, visualização de dashboard, gestão de regras de compliance e consulta a logs de auditoria.
* Documentação técnica e Manual do Usuário entregues e revisados.

## 1.10 EXCLUSÕES DO ESCOPO  {#1.10-exclusões-do-escopo}

* Não haverá aplicativo mobile nativo nesta versão; o acesso será exclusivamente via navegador web.
* Integração com gateways de pagamento ou cartões de crédito está fora do escopo.
* Machine Learning para detecção de padrões suspeitos está previsto como evolução futura (Could Have), não obrigatório na versão inicial.
* Assinatura digital de eventos críticos e aprovação dupla para dispensar violações críticas podem ser implementadas em fases posteriores, conforme priorização.
* O sistema não substitui ERPs ou CRMs; apenas recebe eventos e envia alertas/relatórios, sem gestão transacional de negócio nesses sistemas.

## 1.11 STAKEHOLDERS ENVOLVIDOS  {#1.11-stakeholders-envolvidos}

* **Jonathan Brito** — Autor e desenvolvedor: concepção, desenvolvimento e documentação do sistema.
* **Profº Dennys Cavalcanti Carvalho** — Professor orientador: orientação pedagógica e técnica do projeto.
* **Diretoria / Executivos** — Usuário estratégico: visualização de KPIs e dashboards executivos.
* **Compliance Officer** — Usuário principal: gestão de regras, violações e conformidade.
* **Departamento Jurídico** — Usuário consultivo: relatórios regulatórios e histórico de eventos.
* **Auditor Interno** — Usuário operacional: trilhas de auditoria e registros de ações.
* **Auditor Externo** — Usuário consultivo: acesso controlado a logs e relatórios dentro do escopo definido.
* **Administrador do Sistema** — Usuário técnico: gestão de usuários, perfis e configurações.
* **Time de TI / DevOps** — Equipe técnica: infraestrutura, deploy e monitoramento (quando aplicável).
* **Sistemas Externos (ERPs, CRMs)** — Integração: envio e recebimento de eventos via API/Webhook.

## 1.12 RISCOS INICIAIS  {#1.12-riscos-iniciais}

* **R01 — Integrações com ERPs legados que não suportam Webhooks** (probabilidade alta, impacto alto). Mitigação: desenvolver adaptadores e polling como fallback.
* **R02 — Volume elevado de eventos sobrecarregando o Audit Service** (probabilidade média, impacto alto). Mitigação: escalonamento horizontal e filas com backpressure.
* **R03 — Complexidade na configuração de regras de compliance** (probabilidade média, impacto médio). Mitigação: interface amigável e suporte a templates de regras.
* **R04 — Vazamento de dados sensíveis nos logs** (probabilidade baixa, impacto crítico). Mitigação: criptografia de campos sensíveis e controle rigoroso de acesso.
* **R05 — Dificuldade de adoção pelos usuários finais** (probabilidade média, impacto médio). Mitigação: treinamento e UX intuitivo no dashboard.
* **R06 — Falha na mensageria (RabbitMQ) causando perda de eventos** (probabilidade baixa, impacto alto). Mitigação: dead-letter queues, retries e persistência de mensagens.
* **R07 — Prazo curto da disciplina para entregar todos os microsserviços** (probabilidade média, impacto alto). Mitigação: priorização MoSCoW, MVP com serviços críticos primeiro.
* **R08 — Falta de familiaridade com stack (microsserviços, RabbitMQ, MongoDB)** (probabilidade média, impacto médio). Mitigação: estudo prévio, documentação e protótipos incrementais.

# **2 DOCUMENTO DE ESPECIFICAÇÃO DE REQUISITOS (ERS)** {#2-documento-de-especificação-de-requisitos-(ers)}

## 2.1 REQUISITOS FUNCIONAIS {#2.1-requisitos-funcionais}

Requisitos funcionais são as funções que usuários e clientes esperam que o software ofereça. Eles estão diretamente ligados às funcionalidades que o sistema deve fornecer. Segundo Ian Sommerville, requisitos funcionais definem as funcionalidades específicas que um sistema de software deve realizar para atender às necessidades dos usuários e alcançar os objetivos do projeto.

* **[RF-01] Cadastro, edição e exclusão de usuários**  
  O sistema deve permitir o cadastro de novos usuários com dados obrigatórios (nome completo, e-mail corporativo único, papel, área organizacional, status). Edição e exclusão lógica (inativação) devem ser suportadas. Atores: Administrador. Prioridade: Essencial.  
  Critério de aceitação: Usuário preenche os campos obrigatórios; e-mail é único; exclusão é lógica e registrada em auditoria.

* **[RF-02] Controle de perfis e permissões (RBAC)**  
  O sistema deve implementar controle de acesso baseado em papéis (Administrador, Compliance Officer, Auditor Interno, Auditor Externo, Gestor, Visualizador), com permissões por módulo. Prioridade: Essencial.

* **[RF-03] Autenticação segura (JWT ou OAuth2)**  
  Autenticação deve utilizar JWT ou OAuth2, com tokens de expiração configurável. Prioridade: Essencial.

* **[RF-04] Recuperação de senha**  
  Recuperação de senha por canal seguro (e-mail com link de uso único e expiração de 30 minutos). Prioridade: Essencial.

* **[RF-05] Controle de sessão**  
  Sessão com expiração configurável; suporte a invalidação de sessões ativas. Prioridade: Essencial.

* **[RF-06] Autorização por papéis e módulos**  
  Acesso a módulos (usuários, regras, logs, dashboard, relatórios, violações, configurações, integrações) conforme papel. Prioridade: Essencial.

* **[RF-07] Logs de acesso**  
  Registro de login, logout e tentativas inválidas no log de auditoria. Prioridade: Essencial.

* **[RF-08] Registro imutável de ações (Audit Service)**  
  Todo evento relevante deve ser registrado no Audit Service de forma imutável, com ID, timestamp UTC, ator, ação, entidade, valores anterior/novo e IP. Prioridade: Essencial.

* **[RF-09] Histórico de alterações por entidade**  
  Histórico de alterações por entidade de negócio acessível a usuários autorizados, com ordenação cronológica. Prioridade: Essencial.

* **[RF-10] Versionamento de dados críticos**  
  Regras de compliance versionadas; edição de regra ativa gera nova versão; versão anterior mantida para auditoria. Prioridade: Essencial.

* **[RF-11] Dashboard com KPIs**  
  Dashboard com métricas (índice de conformidade, violações por período, risco por área, tempo de resolução, auditorias pendentes). Prioridade: Essencial.

* **[RF-12] Filtros por período, área e nível de risco**  
  Filtros no dashboard e relatórios por período, área organizacional, tipo de evento, nível de risco e status de violação. Prioridade: Essencial.

* **[RF-13] Exportação de relatórios (PDF, CSV)**  
  Exportação de relatórios com rodapé (data de geração, usuário, período); ação registrada em auditoria. Prioridade: Importante.

* **[RF-14] Atualização dinâmica dos KPIs**  
  KPIs atualizados com defasagem máxima de 60 segundos em relação aos eventos. Prioridade: Importante.

* **[RF-15] Motor de regras de compliance configurável**  
  Compliance Engine com regras configuráveis (nome, descrição, critério de disparo, severidade, status, vigência). Prioridade: Essencial.

* **[RF-16] Geração de violações e pendências**  
  Quando um evento viola regra ativa, o sistema gera violação (Aberta, Em Análise, Resolvida, Dispensada) e notifica responsáveis. Prioridade: Essencial.

* **[RF-17] Cálculo de pontuação de risco**  
  Risk Analysis Service calcula pontuação por evento/usuário/área (níveis Baixo, Médio, Alto, Crítico); recálculo automático. Prioridade: Importante.

* **[RF-18] Integração bidirecional (API/Webhook)**  
  Integration Service para receber e enviar eventos com ERPs/CRMs; autenticação, validação e idempotência. Prioridade: Essencial.

* **[RF-19] Alertas automáticos (e-mail, webhook)**  
  Notification Service para envio de alertas em violações e eventos críticos; reprocessamento e dead-letter. Prioridade: Importante.

* **[RF-20] Machine Learning para padrões suspeitos**  
  Detecção de padrões suspeitos (evolução futura). Prioridade: Desejável.

## 2.2 REQUISITOS NÃO FUNCIONAIS {#2.2-requisitos-não-funcionais}

Os requisitos não funcionais representam atributos de qualidade que um software deve possuir, como desempenho, segurança, usabilidade e confiabilidade, e restrições técnicas do ambiente operacional.

* **[NF-01] Desempenho – tempo de carregamento**  
  O tempo de carregamento da página inicial não deve exceder 3 segundos em rede banda larga. Prioridade: Importante. Critério: Lighthouse ou similar.

* **[NF-02] Segurança – criptografia**  
  Criptografia de dados sensíveis em repouso e em trânsito (HTTPS/TLS; campos críticos no banco). Prioridade: Essencial.

* **[NF-03] Segurança – OWASP**  
  Proteção contra SQL Injection, XSS e demais vulnerabilidades OWASP Top 10. Prioridade: Essencial.

* **[NF-04] Confiabilidade – backup**  
  Backup automatizado com retenção mínima de 30 dias. Prioridade: Essencial.

* **[NF-05] Conformidade – LGPD**  
  Política de retenção, controle de acesso a dados pessoais e consentimento quando aplicável. Prioridade: Essencial.

* **[NF-06] Performance – tempo de resposta**  
  P95 &lt; 500 ms para APIs críticas em operações síncronas. Prioridade: Essencial.

* **[NF-07] Performance – cache**  
  Uso de cache (ex.: Redis) para regras, configurações e parâmetros estáveis. Prioridade: Importante.

* **[NF-08] Performance – processamento assíncrono**  
  Relatórios e análises complexas via filas (RabbitMQ). Prioridade: Importante.

* **[NF-09] Escalabilidade**  
  Escalabilidade horizontal dos microsserviços; suporte a múltiplas instâncias e balanceamento de carga. Prioridade: Importante.

* **[NF-10] Disponibilidade**  
  SLA mínimo de 99,5% para Audit Service e Compliance Engine; health checks por serviço. Prioridade: Importante.

* **[NF-11] Interoperabilidade**  
  APIs RESTful padronizadas; comunicação em JSON; versionamento de API. Prioridade: Essencial.

## 2.3 REGRAS DE NEGÓCIO {#2.3-regras-de-negócio}

As regras de negócio definem os limites, comportamentos e restrições que regem o funcionamento da aplicação, garantindo conformidade com os objetivos organizacionais e legais.

* **[RN-001]** Todo acesso ao sistema exige autenticação prévia. Prioridade: Essencial.

* **[RN-002]** Autenticação via JWT ou OAuth2; tokens com expiração configurável. Prioridade: Essencial.

* **[RN-003]** Após 5 tentativas de login inválidas consecutivas, a conta deve ser bloqueada por no mínimo 15 minutos; registro em auditoria. Prioridade: Essencial.

* **[RN-010]** Todo usuário deve estar associado a pelo menos um perfil; acesso determinado pelo papel; negado por padrão quando não concedido. Prioridade: Essencial.

* **[RN-013]** Somente o Administrador pode criar, editar, desativar usuários e alterar papéis. Prioridade: Essencial.

* **[RN-015]** Somente o Compliance Officer pode criar, editar e desativar regras de compliance. Prioridade: Essencial.

* **[RN-021]** Logs de auditoria são **imutáveis**: nenhum processo pode alterar ou excluir registro após gravação. Prioridade: Essencial.

* **[RN-022]** Cada registro de auditoria deve conter: ID do evento, timestamp UTC, ID do usuário/sistema, ação, entidade, valor anterior/novo (quando aplicável), IP. Prioridade: Essencial.

* **[RN-031]** Regra de compliance só entra em vigor após ser ativada; regras inativas não são aplicadas. Prioridade: Essencial.

* **[RN-035]** Evento que viola regra gera violação com status inicial `Aberta`. Prioridade: Essencial.

* **[RN-037]** Somente Compliance Officer pode dispensar violação, com justificativa obrigatória. Prioridade: Essencial.

* **[RN-040]** Pontuação de risco calculada para usuário, área e processo; níveis Baixo (0–24), Médio (25–49), Alto (50–74), Crítico (75–100). Prioridade: Importante.

* **[RN-051]** Notificações de violações críticas devem chegar ao Compliance Officer e ao gestor em no máximo 5 minutos. Prioridade: Essencial.

* **[RN-070]** Toda integração externa deve ser autenticada (API Key, OAuth2 ou equivalente). Prioridade: Essencial.

* **[RN-073]** Idempotência no processamento de eventos: mesmo evento recebido mais de uma vez não gera duplicatas. Prioridade: Essencial.

* **[RN-080]** Logs de auditoria retidos por no mínimo 5 anos. Prioridade: Essencial.

* **[RN-092]** Exclusão de usuários é lógica (inativação); não é permitida remoção permanente para preservar histórico. Prioridade: Essencial.

* **[RN-105]** O sistema não deve expor mensagens de erro técnicas (stack traces, SQL) ao usuário final; erros genéricos e registro interno. Prioridade: Essencial.

# 

# **3 DOCUMENTO DE ESPECIFICAÇÃO DE MODELAGEM (DEM)**  {#3-documento-de-especificação-de-modelagem-(dem)}

## 3.1 MODELAGEM DE DADOS {#3.1-modelagem-de-dados}

### **3.1.1 Entidade-Relacionamento** {#3.1.1-entidade-relacionamento}

O modelo de dados do sistema utiliza **dois contextos de persistência**:

* **Banco relacional (PostgreSQL):** entidades estruturadas e críticas — **Usuário** (id, nome, e-mail, senha_hash, papel_id, area_id, status, criado_em, atualizado_em); **Perfil/Papel** (id, nome, descricao); **Permissao** (id, modulo, acao); **RegraCompliance** (id, nome, descricao, criterio, severidade, status, vigencia_inicio, vigencia_fim, versao, criado_por, criado_em); **AreaOrganizacional** (id, nome, pai_id); **Violacao** (id, evento_id, regra_id, severidade, status, criada_em, resolvida_em, justificativa); **ConfiguracaoIntegracao** (id, sistema_origem, tipo_auth, endpoint, ativo). Relacionamentos: Usuário N:1 Perfil, Usuário N:1 AreaOrganizacional; Perfil N:N Permissao; RegraCompliance 1:N Violacao; Violacao N:1 Evento (referência).

* **Banco não relacional (MongoDB):** documentos **imutáveis** de auditoria — **EventoAuditoria** (id, timestamp_utc, usuario_id ou sistema_origem, acao, entidade, entidade_id, valor_anterior, valor_novo, ip_origem, metadados). Sem alteração ou exclusão após gravação.

O diagrama ER completo deve ser elaborado na ferramenta de modelagem (ex.: draw.io, PlantUML ou BR Modelo) e inserido neste documento ou no Apêndice, com legenda "Fonte: Autoria própria (2026)".

### **3.1.2 Dicionário de Dados**  {#3.1.2-dicionário-de-dados}

O dicionário de dados deve listar, para cada entidade do modelo relacional e para os documentos de auditoria, os atributos com: nome, tipo, tamanho, obrigatoriedade, descrição e regras de validação. Exemplos: **Usuario.email** — VARCHAR(255), único, obrigatório, e-mail corporativo; **RegraCompliance.severidade** — ENUM('Baixo','Médio','Alto','Crítico'); **EventoAuditoria.timestamp_utc** — DATETIME, obrigatório, sempre em UTC. O dicionário completo pode ser incluído no Apêndice.

## 3.2 MODELAGEM COMPORTAMENTAL  {#3.2-modelagem-comportamental}

### **3.2.1 Diagrama de Sequência**	 {#3.2.1-diagrama-de-sequência}

Os diagramas de sequência devem representar os fluxos principais do sistema, por exemplo: (1) **Registro de evento de auditoria:** Ator/Sistema → Integration Service → RabbitMQ → Audit Service (grava) → Compliance Engine (valida regras) → geração de violação (se aplicável) → Notification Service; (2) **Login:** Usuário → API Auth → validação → emissão JWT → registro em auditoria; (3) **Gestão de regra de compliance:** Compliance Officer → API → versionamento da regra → auditoria. Cada diagrama deve ser produzido em ferramenta (PlantUML, draw.io) e inserido no documento ou Apêndice.

### **3.2.2 Diagrama de Estados** {#3.2.2-diagrama-de-estados}

Recomenda-se diagrama de estados para: **Violação** — estados *Aberta* → *Em Análise* → *Resolvida* ou *Dispensada*; **RegraCompliance** — *Rascunho* → *Ativa* → *Inativa*; **Usuario** — *Ativo* ↔ *Inativo*. Transições devem refletir as regras de negócio (ex.: apenas Compliance Officer pode dispensar violação). Inserir figura com legenda "Fonte: Autoria própria (2026)".

## 3.3 MODELAGEM ESTRUTURAL {#3.3-modelagem-estrutural}

### **3.3.1 Diagrama de Caso de Uso**	 {#3.3.1-diagrama-de-caso-de-uso}

Atores: Administrador, Compliance Officer, Auditor Interno, Auditor Externo, Gestor, Visualizador, Sistema Externo (ERP/CRM). Casos de uso principais: Login / Recuperar senha; Gerenciar usuários e perfis; Gerenciar regras de compliance; Consultar logs de auditoria; Visualizar dashboard e KPIs; Exportar relatórios; Gerenciar violações; Configurar integrações; Receber evento (sistema externo). Incluir diagrama na ferramenta escolhida.

### **3.3.2 Diagrama de Componentes** {#3.3.2-diagrama-de-componentes}

Componentes: **Front-end** (aplicação web); **API Gateway / Backend for Front-end** (se houver); **Audit Service**, **Compliance Engine**, **Risk Analysis Service**, **Reporting Service**, **Integration Service**, **Notification Service**; **PostgreSQL**, **MongoDB**, **Redis**, **RabbitMQ**. Mostrar dependências entre componentes e com infraestrutura.

### **3.3.3 Diagrama de Arquitetura**	 {#3.3.3-diagrama-de-arquitetura}

Diagrama de arquitetura de alto nível: usuários → front-end → APIs dos microsserviços; microsserviços comunicando-se via RabbitMQ; persistência PostgreSQL (dados críticos) e MongoDB (logs imutáveis); Redis (cache); sistemas externos ↔ Integration Service. Referência na seção 5.1.

## 3.4 MAPEAMENTO OBJETO-RELACIONAL (ORM) {#3.4-mapeamento-objeto-relacional-(orm)}

O mapeamento objeto-relacional aplica-se às entidades do **PostgreSQL**. Deve ser documentado conforme a tecnologia escolhida (ex.: JPA/Hibernate no Java/Spring Boot): entidades anotadas (@Entity, @Table, @Column), relacionamentos (@OneToMany, @ManyToOne, @ManyToMany), índices e constraints. O Audit Service persiste em MongoDB; o mapeamento para documentos (ODM ou equivalente) deve ser descrito separadamente. Trechos de código representativos podem constar no Apêndice.

## 3.5 BPMN (BUSINESS PROCESS MODEL AND NOTATION) {#3.5-bpmn-(business-process-model-and-notation)}

Processos de negócio que podem ser modelados em BPMN: **Processo de registro e validação de evento** (recebimento → validação → gravação em auditoria → aplicação de regras → geração de violação/notificação); **Processo de análise de violação** (abertura → análise → resolução ou dispensa com justificativa); **Processo de recuperação de senha**. Inserir diagramas BPMN com legenda "Fonte: Autoria própria (2026)" quando elaborados.

#   

# **4 DOCUMENTO DE ESPECIFICAÇÃO DE INTERFACES (DEI)** {#4-documento-de-especificação-de-interfaces-(dei)}

## 4.1 WIREFRAMES			 {#4.1-wireframes}

Os wireframes devem representar as telas principais do sistema: **Login**; **Dashboard** (KPIs, filtros por período/área/risco); **Listagem e formulário de usuários** (cadastro/edição com perfil e área); **Listagem e formulário de regras de compliance**; **Consulta a logs de auditoria** (filtros e detalhe do evento); **Listagem de violações** (status, severidade, ações); **Configurações de integração**; **Relatórios e exportação**. Incluir legendas "Figura X – [Título]. Fonte: Autoria própria (2026)" e inserir no documento ou Apêndice.

## 4.2 MOCKUPS {#4.2-mockups}

Os mockups refinam os wireframes com identidade visual (cores, tipografia, componentes de UI), mantendo consistência com o público corporativo (diretoria, compliance, auditores). Destacar: dashboard com gráficos e indicadores; tabelas com ordenação e filtros; mensagens de erro/sucesso padronizadas; área de navegação por módulos conforme perfil do usuário.

## 4.3 FLUXO DE NAVEGAÇÃO	 {#4.3-fluxo-de-navegação}

Descrever o fluxo de navegação após login: **Menu principal** por módulos (Dashboard, Usuários, Regras de Compliance, Auditoria, Violações, Relatórios, Configurações/Integrações), com itens visíveis conforme perfil (RBAC). Fluxos típicos: Dashboard → filtrar período → exportar relatório; Regras de Compliance → nova regra → ativar; Violações → abrir violação → Em Análise → Resolver ou Dispensar. Diagrama de fluxo (ou mapa de navegação) deve ser incluído com legenda "Fonte: Autoria própria (2026)".

# **5 DOCUMENTAÇÃO TÉCNICA** {#5-documentação-técnica}

## 5.1 ARQUITETURA DO SISTEMA {#5.1-arquitetura-do-sistema}

O sistema adota **arquitetura de microsserviços orientada a eventos**. A macroestrutura contempla: (1) **Front-end** desacoplado (aplicação web) consumindo APIs REST; (2) **Microsserviços** independentes — Audit Service, Compliance Engine, Risk Analysis Service, Reporting Service, Integration Service, Notification Service — cada um com responsabilidade única; (3) **Comunicação assíncrona** via **RabbitMQ** como barramento de mensagens; (4) **Persistência** dual: **PostgreSQL** para dados estruturados e críticos (usuários, perfis, regras, violações, configurações) e **MongoDB** para logs de auditoria imutáveis; (5) **Redis** para cache de regras e parâmetros; (6) **Integration Service** na borda para receber e enviar eventos com sistemas externos (ERPs, CRMs). O Diagrama de Arquitetura referido na seção 3.3.3 ilustra essa visão de alto nível.

### **5.1.1 Segmentação da Arquitetura** {#5.1.1-segmentação-da-arquitetura}

Cada microsserviço deve seguir uma **segmentação em camadas** (ou estilo hexagonal): **API/Controller** (entrada HTTP, validação de entrada, DTOs); **Aplicação/Serviço** (orquestração, regras de aplicação); **Domínio** (entidades, regras de negócio puras); **Infraestrutura** (repositórios, mensageria, clientes externos). A comunicação entre serviços é preferencialmente assíncrona via filas; eventos publicados no RabbitMQ são consumidos pelos serviços interessados. O front-end consome apenas APIs REST expostas pelos microsserviços (ou por um API Gateway, se implementado).

## 5.2 TECNOLOGIAS UTILIZADAS {#5.2-tecnologias-utilizadas}

### **5.2.1 Frontend** {#5.2.1-frontend}

Linguagens e frameworks a serem utilizados: **HTML5**, **CSS3**, **JavaScript** (ou TypeScript); framework **React** (ou equivalente) para interface reativa; bibliotecas de estilo/componentes conforme escolha do desenvolvedor (ex.: Material-UI, Chakra UI, Tailwind CSS). Versões devem ser documentadas no repositório (package.json). O front-end consome apenas APIs REST do back-end em JSON.

### **5.2.2 Backend** {#5.2.2-backend}

Back-end em **microsserviços**; linguagem e framework a serem definidos (ex.: **Java com Spring Boot** para cada serviço, ou Node.js, .NET Core, etc.). Uso de bibliotecas para JWT/OAuth2, validação, serialização JSON e clientes HTTP e de mensageria (AMQP para RabbitMQ). Versões documentadas no repositório (pom.xml, package.json ou equivalente).

### **5.2.3 Banco de Dados** {#5.2.3-banco-de-dados}

* **PostgreSQL:** SGBD relacional para usuários, perfis, regras de compliance, áreas organizacionais, violações, configurações de integração. ORM/ODM conforme stack (ex.: JPA/Hibernate no Java).
* **MongoDB:** banco não relacional para **logs imutáveis de auditoria** (eventos); alta performance de escrita e leitura; ODM ou driver nativo conforme linguagem.
* **Redis:** cache para regras ativas, configurações e parâmetros estáveis, reduzindo carga no PostgreSQL.

### **5.2.4 Ferramentas de Apoio** {#5.2.4-ferramentas-de-apoio}

**Docker** para containerização dos serviços e dependências (PostgreSQL, MongoDB, RabbitMQ, Redis); **Git** para controle de versão; **Postman** ou **Insomnia** para testes de API; **Lighthouse** ou **GTmetrix** para métricas de desempenho do front-end; ferramentas de IA e editores (ex.: Cursor, VS Code) conforme uso pela equipe. CI/CD (ex.: GitHub Actions) para testes e deploy quando aplicável.

### **5.2.5 Padrões Adotados** {#5.2.5-padrões-adotados}

* **Repository:** abstração de persistência; domínio não acessa diretamente o banco.
* **Dependency Injection:** injeção de repositórios e serviços via framework (ex.: Spring) para facilitar testes e troca de implementações.
* **DTO (Data Transfer Object):** troca de dados entre API e serviços sem expor entidades.
* **Producer/Consumer (mensageria):** publicação e consumo de eventos no RabbitMQ para desacoplamento.
* **Circuit Breaker / Retry:** para integrações externas e consumo de filas (retries e dead-letter).
* **Factory** (quando aplicável) para construção de regras ou eventos a partir de payloads externos.

### **5.2.6 Boas Práticas e Convenções** {#5.2.6-boas-práticas-e-convenções}

* **SOLID:** Domínio independente de infraestrutura (DIP); interfaces para repositórios e clientes externos; responsabilidade única por serviço e por classe (SRP).
* **Clean Code:** Nomes significativos para funções e variáveis; funções pequenas e com responsabilidade única; código autodocumentado, evitando comentários óbvios.
* **DTOs:** Comunicação entre camadas via DTOs; entidades do banco não expostas na API.
* **Tratamento de erros:** Try-catch global ou por camada; retorno de mensagens amigáveis ao usuário; stack traces e detalhes apenas em logs internos (RN-105).
* **Versionamento:** Tags no Git (ex.: v1.0.0) e mensagens de commit claras (ex.: convenção Conventional Commits).
* **Padrão de resposta de API:** Respostas REST padronizadas (ex.: `{ "data": ..., "error": null, "message": "..." }` em sucesso; `error` preenchido em falha).
* **Segurança:** Variáveis de ambiente (.env) para chaves, senhas e URLs; criptografia de dados sensíveis em repouso e HTTPS em trânsito; sem exposição de dados sensíveis em logs.

### **5.2.7 Requisitos de Infraestrutura** {#5.2.7-requisitos-de-infraestrutura}

* **Produção/execução:** SO moderno (Linux recomendado); memória RAM mínima conforme stack (ex.: 2 GB para um conjunto reduzido de serviços em Docker); acesso a redes para PostgreSQL, MongoDB, RabbitMQ e Redis (ou containers locais).
* **Desenvolvimento:** IDE ou editor; Docker e Docker Compose para subir dependências; Node.js ou JDK conforme front-end/back-end; Git.

### **5.2.8 APIs e Integrações** {#5.2.8-apis-e-integrações}

O sistema **recebe** eventos de **ERPs e CRMs** via API REST ou Webhook (Integration Service); **envia** alertas e relatórios para sistemas externos via webhook ou API quando configurado. Serviço de **e-mail** (SMTP ou provedor) é utilizado pelo Notification Service para envio de alertas e recuperação de senha. Todas as integrações devem ser autenticadas (API Key, OAuth2 ou equivalente) e ter logs de chamadas e tratamento de falhas (retry, timeout, dead-letter).

### **5.2.9 Caracterização da API** {#5.2.9-caracterização-da-api}

O projeto expõe **APIs REST**: recursos nomeados (ex.: `/usuarios`, `/regras`, `/eventos`, `/violacoes`), verbos HTTP (GET, POST, PUT, PATCH, DELETE) conforme semântica, e códigos de status adequados (200, 201, 400, 401, 403, 404, 500). Formato de troca de dados: **JSON**. Versionamento de API recomendado (ex.: prefixo `/v1/`) para evolução sem quebra de integrações.

## 5.3 REPOSITÓRIO E CÓDIGO-FONTE {#5.3-repositório-e-código-fonte}

* **Link do repositório:** o código-fonte deve ser disponibilizado em repositório Git (ex.: GitHub/GitLab), com URL informado aqui (ex.: `https://github.com/[usuario]/Complice-e-Auditoria`).

* **Estrutura de pastas (visão esperada / atual):**

```
Complice-e-Auditoria/
├── docs/                    # Documentação do projeto
│   ├── DDE Jonathan.md      # Este documento
│   ├── AnaliseRequisitos.md
│   ├── VisaoGeralProjeto.md
│   ├── RequisitosCorp.md
│   ├── IdeiaInicial.md
│   └── RegrasDeNegocio.md
├── frontend/                 # Aplicação web (React ou equivalente)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/        # Chamadas à API
│   │   └── ...
│   └── package.json
├── backend/                  # Microsserviços (ou um por pasta: audit-service, compliance-engine, etc.)
│   ├── audit-service/
│   ├── compliance-engine/
│   ├── ...
│   └── integration-service/
├── docker-compose.yml       # Serviços de infraestrutura (PostgreSQL, MongoDB, RabbitMQ, Redis)
└── README.md
```

* **Conteúdo das pastas:** **docs** — toda a documentação (DDE, ERS, DEM, requisitos, regras de negócio). **frontend** — interface do usuário; lógica de apresentação e chamadas à API. **backend** — cada subpasta corresponde a um microsserviço; dentro delas, procurar por pacotes/camadas de controller, service, domain e repository (ou equivalente). Testes unitários e de integração geralmente ficam junto ao módulo (ex.: `*Test` ou pasta `tests`). Configurações de ambiente em arquivos `.env.example` (sem segredos) e uso de variáveis de ambiente em execução.

# **6 MANUAL DO USUÁRIO** {#6-manual-do-usuário}

O Manual do Usuário é voltado a quem vai **usar** o Sistema de Compliance e Auditoria no dia a dia (diretoria, compliance, auditores, gestores), com linguagem simples e passo a passo. Evite termos técnicos como "API" ou "endpoint"; use "sistema", "página" ou "tela".

**Requisitos para acessar o sistema**

* **Navegador:** use Chrome, Edge ou Firefox atualizado (acesso via web).
* **Resolução de tela:** mínima recomendada 1366x768; ideal 1920x1080.
* **Credenciais de teste:** o avaliador ou administrador deve fornecer um **usuário** e **senha** de teste (ex.: usuário padrão para Compliance Officer ou Visualizador). Não utilizar credenciais reais de produção em ambiente de teste.

**Estrutura sugerida (fluxos de tarefas)**

Organize o manual por **tarefas**, não só por telas. Use prints de tela com setas, círculos ou numeração (1, 2, 3) indicando onde clicar. Texto curto e direto.

* **Como fazer login:** 1. Acesse o endereço do sistema no navegador. 2. Digite seu **e-mail** e **senha**. 3. Clique no botão **"Entrar"**. Se aparecer "Credenciais inválidas", verifique o e-mail e a senha ou use "Esqueci minha senha".
* **Como visualizar o dashboard:** Após o login, a tela inicial mostra os indicadores (KPIs). Use os filtros (período, área, nível de risco) e clique em **"Aplicar"** para atualizar os dados.
* **Como cadastrar um usuário** (somente Administrador): 1. No menu, acesse **"Usuários"**. 2. Clique em **"Novo usuário"**. 3. Preencha os campos obrigatórios (nome, e-mail, perfil, área). 4. Clique em **"Salvar"**. O sistema enviará um e-mail para o usuário definir a senha.
* **Como criar uma regra de compliance** (somente Compliance Officer): 1. Acesse **"Regras de Compliance"**. 2. Clique em **"Nova regra"**. 3. Preencha nome, descrição, critério de disparo e severidade. 4. Salve e **ative** a regra para que passe a valer.
* **Como consultar logs de auditoria:** 1. Acesse **"Auditoria"** ou **"Logs"**. 2. Use os filtros (data, usuário, ação, entidade). 3. Clique em um registro para ver detalhes (quem, quando, o que alterou).
* **Como tratar uma violação:** 1. Acesse **"Violações"**. 2. Abra a violação desejada. 3. Altere o status para "Em Análise" e, ao final, para **"Resolvida"** ou **"Dispensada"** (Dispensada exige justificativa e só é permitida para Compliance Officer).

**Glossário de mensagens e alertas**

| Mensagem ou situação | Significado |
|----------------------|-------------|
| "Credenciais inválidas" | E-mail ou senha incorretos. Verifique ou use "Esqueci minha senha". |
| "Conta bloqueada temporariamente" | Muitas tentativas de login erradas. Aguarde o tempo indicado (ex.: 15 minutos). |
| "E-mail já cadastrado" | Já existe um usuário com esse e-mail. Use outro ou edite o existente. |
| "Acesso negado" ou "Sem permissão" | Seu perfil não permite essa ação. Contate o administrador. |
| "Registro salvo com sucesso" | A operação foi concluída. |
| "Preencha os campos obrigatórios" | Há campos marcados com * que não foram preenchidos. |

**FAQ e resolução de problemas**

* **Esqueci minha senha.** Use o link "Esqueci minha senha" na tela de login; informe seu e-mail e siga as instruções enviadas por e-mail (link válido por tempo limitado).
* **O botão "Salvar" não habilita.** Verifique se todos os campos obrigatórios (marcados com *) estão preenchidos e se não há mensagem de erro em vermelho na tela.
* **Não consigo acessar um módulo.** Seu perfil pode não ter permissão para aquele módulo. Consulte o administrador do sistema.
* **O dashboard não atualiza.** Verifique os filtros (período, área) e clique em **"Aplicar"** ou atualize a página. Em sistema em tempo real, a atualização pode levar até 1 minuto.
* **Mensagem de "sessão expirada".** Faça login novamente; a sessão expira após um tempo de inatividade por segurança.

**Destaque de botões:** Sempre que citar um botão, use **negrito** ou aspas, por exemplo: "Clique em **Confirmar**".

# **7\. REFERÊNCIAS** {#7.-referências}

Documentos do projeto (repositório Complice-e-Auditoria):

* AnaliseRequisitos.md — Análise de requisitos, stakeholders, casos de uso, restrições e riscos. Repositório do projeto. Acesso em: 13 mar. 2026.

* IdeiaInicial.md — Concepção inicial da plataforma de compliance e auditoria. Repositório do projeto. Acesso em: 13 mar. 2026.

* RegrasDeNegocio.md — Regras de negócio (RN-001 a RN-105) por domínio. Repositório do projeto. Acesso em: 13 mar. 2026.

* RequisitosCorp.md — Requisitos para sistema corporativo (funcionais, não funcionais, arquitetura, mensageria). Repositório do projeto. Acesso em: 13 mar. 2026.

* VisaoGeralProjeto.md — Visão geral, arquitetura de microsserviços, fluxo, banco de dados e infraestrutura. Repositório do projeto. Acesso em: 13 mar. 2026.

Literatura e documentação técnica:

* MARTIN, Robert C. Código limpo: habilidades práticas do software Agile. Rio de Janeiro: Alta Books, 2011.

* SOMMERVILLE, Ian. Engenharia de software. 10. ed. São Paulo: Pearson, 2018.

* OWASP. OWASP Top Ten. 2021. Disponível em: https://owasp.org/www-project-top-ten/. Acesso em: 13 mar. 2026.

* RABBITMQ. RabbitMQ documentation. 2024. Disponível em: https://www.rabbitmq.com/documentation.html. Acesso em: 13 mar. 2026.

* THE MONGODB DOCUMENTATION. MongoDB Manual. 2024. Disponível em: https://www.mongodb.com/docs/. Acesso em: 13 mar. 2026.

* POSTGRESQL. PostgreSQL documentation. 2024. Disponível em: https://www.postgresql.org/docs/. Acesso em: 13 mar. 2026.

* Brasil. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Disponível em: http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 13 mar. 2026.

# **8\. APÊNDICE** {#8.-apêndice}

Inclua nesta seção todos os materiais complementares produzidos por si. É obrigatória a inclusão de todo o código fonte do projeto na linguagem desenvolvida, scripts de criação, manipulação de base de dados, logs para comprovação dos testes, scripts de marcação de texto referente a ferramentas diversas como LaTeX, PlantUML, etc.  
Utilize fonte monospaçada tamanho 10 para blocos de código.

O Apêndice é o local onde o aluno coloca materiais que ele mesmo produziu, mas que são demasiado extensos ou detalhados para figurar no meio dos capítulos principais, pois poderiam interromper a fluidez da leitura.

Diferente do Anexo (que é material de terceiros), o Apêndice é autoria do próprio aluno.

# Orientações Gerais

## **📘 Guia Rápido de Formatação ABNT (Relatório Técnico)**

Olá, pessoal. Para a entrega do nosso **Relatório Técnico**, sigam estas diretrizes de formatação baseadas nas normas **NBR 14724** e **NBR 6023**. Um bom desenvolvedor também entrega uma documentação impecável\!

## **1\. Configuração da Página e Texto**

* **Fonte:** Arial ou Times New Roman (escolha uma e use no documento todo).  
* **Tamanho:** **12** para o texto geral e **10** para citações longas, notas de rodapé, legendas de imagens/tabelas e números de página.  
* **Espaçamento:** **1,5** no corpo do texto e **Simples** para citações longas (\> 3 linhas), legendas e referências.  
* **Margens:** Superior e Esquerda: **3 cm** | Inferior e Direita: **2 cm**.  
* **Parágrafos:** Recuo de **1,25 cm** na primeira linha.  
* **Alinhamento:** **Justificado** (exceto nas Referências, que ficam à esquerda).

## **2\. Hierarquia de Títulos (Sumário)**

Mantenham o padrão de destaque para facilitar a leitura do seu sumário:

1. **1 SEÇÃO PRIMÁRIA** (MAIÚSCULAS E NEGRITO)  
2. 1.1 SEÇÃO SECUNDÁRIA (MAIÚSCULAS SEM NEGRITO)  
3. **1.1.1 Seção terciária** (Minúsculas e Negrito \- apenas a 1ª letra maiúscula)  
4. 1.1.1.1 Seção quaternária (Minúsculas sem negrito)

## **3\. Elementos Gráficos (Diagramas e Prints)**

Como nosso relatório tem muita modelagem (UML, BPMN, DER), toda imagem deve ter:

* **Topo:** "Figura X – Título da Imagem" (Tamanho 10, Centralizado).  
* **Base:** "Fonte: Autoria própria (2026)" ou "Fonte: Adaptado de \[Autor\] (2026)" (Tamanho 10, Centralizado).

[image1]: <data:image/png;base64,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>