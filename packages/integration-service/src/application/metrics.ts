import client from "prom-client";

export class IntegrationMetrics {
  readonly registry: client.Registry;
  readonly eventsReceivedTotal: client.Counter<string>;
  readonly eventsAcceptedTotal: client.Counter<string>;
  readonly eventsRejectedTotal: client.Counter<string>;
  readonly eventsDuplicateTotal: client.Counter<string>;
  readonly publishSuccessTotal: client.Counter<string>;
  readonly publishFailedTotal: client.Counter<string>;
  readonly retriesTotal: client.Counter<string>;
  readonly deadLetterTotal: client.Counter<string>;
  readonly rateLimitedTotal: client.Counter<string>;

  constructor(registry?: client.Registry) {
    const isNewRegistry = registry == null;
    this.registry = registry ?? new client.Registry();
    if (isNewRegistry) {
      this.registry.setDefaultLabels({ service: "integration-service" });
      client.collectDefaultMetrics({ register: this.registry });
    }

    this.eventsReceivedTotal = new client.Counter({
      name: "integration_events_received_total",
      help: "Total inbound events received by HTTP endpoint",
      registers: [this.registry],
    });
    this.eventsAcceptedTotal = new client.Counter({
      name: "integration_events_accepted_total",
      help: "Total inbound events accepted for async publishing",
      registers: [this.registry],
    });
    this.eventsRejectedTotal = new client.Counter({
      name: "integration_events_rejected_total",
      help: "Total inbound events rejected by validation/auth/errors",
      registers: [this.registry],
    });
    this.eventsDuplicateTotal = new client.Counter({
      name: "integration_events_duplicate_total",
      help: "Total inbound events ignored due to eventId idempotency",
      registers: [this.registry],
    });
    this.publishSuccessTotal = new client.Counter({
      name: "integration_outbox_publish_success_total",
      help: "Total outbox events successfully published",
      registers: [this.registry],
    });
    this.publishFailedTotal = new client.Counter({
      name: "integration_outbox_publish_failed_total",
      help: "Total outbox publish failures",
      registers: [this.registry],
    });
    this.retriesTotal = new client.Counter({
      name: "integration_outbox_retries_total",
      help: "Total outbox retries incremented",
      registers: [this.registry],
    });
    this.deadLetterTotal = new client.Counter({
      name: "integration_outbox_dead_letter_total",
      help: "Total outbox events moved to dead-letter terminal state",
      registers: [this.registry],
    });
    this.rateLimitedTotal = new client.Counter({
      name: "integration_rate_limited_total",
      help: "Total HTTP requests rate limited",
      registers: [this.registry],
    });
  }
}
