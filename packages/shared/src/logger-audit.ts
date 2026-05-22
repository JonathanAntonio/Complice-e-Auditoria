import pino, { multistream } from "pino";
import { EXCHANGE_AUDIT_LOGS } from "./rabbitmq.constants";
import { createEventEnvelopeV1, publishEventEnvelopeV1 } from "./events/event-envelope";
import type { EventEnvelopeV1 } from "./events/event-envelope";

export interface AuditPublisher {
  publish(envelope: EventEnvelopeV1<object>): Promise<void> | void;
}

export class AuditUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditUnavailableError";
  }
}

export interface HttpAuditPublisherOptions {
  failClosed?: boolean;
  onUnavailable?: (error: AuditUnavailableError) => void;
}

export interface AuditStreamOptions {
  failClosed?: boolean;
  onUnavailable?: (error: AuditUnavailableError) => void;
}

/**
 * Publicador que usa um canal RabbitMQ para enviar envelopes de auditoria.
 */
export class RabbitMqAuditPublisher implements AuditPublisher {
  constructor(
    private readonly channel: {
      publish: (ex: string, rk: string, content: Buffer, opts?: Record<string, unknown>) => boolean;
    },
    private readonly exchange: string = EXCHANGE_AUDIT_LOGS
  ) {}

  async publish(envelope: EventEnvelopeV1<object>): Promise<void> {
    const published = publishEventEnvelopeV1(this.channel, this.exchange, envelope);
    if (!published) {
      throw new AuditUnavailableError("RabbitMQ channel rejected audit publish");
    }
  }
}

/**
 * Publicador que usa HTTP (fetch) para enviar envelopes de auditoria para o audit-service.
 */
export class HttpAuditPublisher implements AuditPublisher {
  constructor(
    private readonly auditServiceUrl: string,
    private readonly options: HttpAuditPublisherOptions = {}
  ) {}

  async assertAvailable(): Promise<void> {
    try {
      const response = await fetch(`${this.auditServiceUrl}/health`, { method: "GET" });
      if (!response.ok) {
        throw new AuditUnavailableError(`Audit health check failed with status ${response.status}`);
      }
    } catch (err) {
      throw this.toUnavailableError(err, "Audit health check request failed");
    }
  }

  async publish(envelope: EventEnvelopeV1<object>): Promise<void> {
    try {
      const response = await fetch(`${this.auditServiceUrl}/api/v1/audit/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      if (!response.ok) {
        throw new AuditUnavailableError(`Failed to publish audit log: ${response.status} ${response.statusText}`);
      }
    } catch (err: unknown) {
      const unavailable = this.toUnavailableError(err, "Error publishing audit log");
      if (this.options.failClosed) {
        this.options.onUnavailable?.(unavailable);
        throw unavailable;
      }
      process.stderr.write(`[Audit-HTTP] ${unavailable.message}\n`);
    }
  }

  private toUnavailableError(err: unknown, fallback: string): AuditUnavailableError {
    if (err instanceof AuditUnavailableError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new AuditUnavailableError(`${fallback}: ${message}`);
  }
}

/**
 * Cria um stream para o Pino que encaminha logs (especialmente erros) 
 * para o transport de auditoria através de um publicador.
 */
export function createAuditStream(publisher: AuditPublisher, serviceName: string, options: AuditStreamOptions = {}) {
  const handleUnavailable = (err: unknown): void => {
    const unavailable =
      err instanceof AuditUnavailableError
        ? err
        : new AuditUnavailableError(err instanceof Error ? err.message : String(err));
    if (options.failClosed) {
      options.onUnavailable?.(unavailable);
      return;
    }
    process.stderr.write(`[Audit] ${unavailable.message}\n`);
  };

  return {
    write(msg: string) {
      try {
        const log = JSON.parse(msg);
        
        // Captura erros (level >= 50) ou logs que tenham a flag "audit: true" ou severity alta
        const isError = log.level >= 50;
        const isAudit = log.audit === true || log.severity === "high" || log.severity === "critical";

        if (isError || isAudit) {
          const severity = isError ? "high" : (log.severity || "medium");
          const type = isError ? "system.error" : (log.eventType || `system.audit.${log.msg?.toLowerCase().replace(/\s+/g, "_") || "log"}`);

          const envelope = createEventEnvelopeV1({
            type,
            producer: serviceName,
            payload: {
              ...log,
              severity,
              originalLevel: log.level,
            },
            correlationId: log.correlationId || log.reqId || log.requestId,
          });

          // Publicação assíncrona
          const result = publisher.publish(envelope);
          if (result instanceof Promise) {
            result.catch((err) => {
              handleUnavailable(err);
            });
          }
        }
      } catch (err) {
        handleUnavailable(err);
      }
    }
  };
}

/**
 * Utilitário para adicionar auditoria a um logger existente.
 */
export function wrapWithAudit(
  baseLogger: pino.Logger,
  publisher: AuditPublisher,
  serviceName: string,
  options: AuditStreamOptions = {}
): pino.Logger {
  const auditStream = createAuditStream(publisher, serviceName, options);
  
  // Pino multistream para enviar para stdout e para o stream de auditoria
  return pino({
    level: baseLogger.level,
    base: baseLogger.bindings(),
  }, multistream([
    { stream: process.stdout },
    { stream: auditStream, level: "info" }
  ]));
}
