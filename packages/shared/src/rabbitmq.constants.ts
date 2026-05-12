/**
 * Constantes para RabbitMQ: exchanges e filas compartilhados.
 * Centralize aqui para manter contrato entre publicadores e consumidores.
 */
export const EXCHANGE_USER_EVENTS = "user.events";
export const EXCHANGE_DOMAIN_EVENTS = "domain.events";

export const QUEUE_USER_CREATED_COMPLIANCE = "compliance.user_created";
export const QUEUE_DOMAIN_EVENTS_COMPLIANCE = "compliance.domain_events";
/** Fila para mensagens UserCreated que excederam MAX_RETRIES (dead-letter / inspeção). */
export const QUEUE_USER_CREATED_COMPLIANCE_FAILED = "compliance.user_created.failed";
/** Fila de auditoria para captura de eventos publicados no exchange compartilhado. */
export const QUEUE_AUDIT_EVENTS = "audit.events";

/** Exchange para logs técnicos e erros de sistema para auditoria centralizada. */
export const EXCHANGE_AUDIT_LOGS = "audit.logs";
