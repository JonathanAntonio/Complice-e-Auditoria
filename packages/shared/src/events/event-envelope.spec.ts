import { describe, expect, it } from "vitest";
import {
  EVENT_ENVELOPE_VERSION_V1,
  consumeEventEnvelopeV1,
  createEventEnvelopeV1,
  parseEventEnvelopeV1,
  publishEventEnvelopeV1,
  routingKeyFromEventType,
  serializeEventEnvelopeV1,
  validateEventEnvelopeV1,
} from "./event-envelope";

describe("event envelope v1", () => {
  it("creates a valid envelope with defaults", () => {
    const envelope = createEventEnvelopeV1({
      type: "user.created",
      producer: "identity-service",
      payload: { userId: "u1" },
    });

    expect(envelope.version).toBe(EVENT_ENVELOPE_VERSION_V1);
    expect(envelope.eventId).toBeDefined();
    expect(envelope.correlationId).toBeDefined();
    expect(envelope.occurredAtUTC).toContain("T");
  });

  it("serializes and parses envelope", () => {
    const envelope = createEventEnvelopeV1({
      type: "identity.auth.login_succeeded",
      producer: "identity-service",
      payload: { userId: "u1", ip: "127.0.0.1" },
      correlationId: "corr-1",
    });

    const buffer = serializeEventEnvelopeV1(envelope);
    const parsed = parseEventEnvelopeV1(buffer);

    expect(parsed.type).toBe(envelope.type);
    expect(parsed.payload).toEqual(envelope.payload);
    expect(parsed.correlationId).toBe("corr-1");
  });

  it("rejects invalid envelope", () => {
    expect(() =>
      validateEventEnvelopeV1({
        type: "x",
        payload: {},
      })
    ).toThrow();
  });

  it("publishes envelope with derived routing key", () => {
    let received: { exchange: string; routingKey: string; content: Buffer } | null = null;
    const channel = {
      publish(exchange: string, routingKey: string, content: Buffer): boolean {
        received = { exchange, routingKey, content };
        return true;
      },
    };
    const envelope = createEventEnvelopeV1({
      type: "identity.auth.logout",
      producer: "identity-service",
      payload: { userId: "u1" },
    });

    const ok = publishEventEnvelopeV1(channel, "events", envelope);
    expect(ok).toBe(true);
    expect(received).not.toBeNull();
    expect(received!.routingKey).toBe("identity_auth_logout");
    const consumed = consumeEventEnvelopeV1({ content: received!.content });
    expect(consumed.type).toBe(envelope.type);
  });

  it("converts type to routing key", () => {
    expect(routingKeyFromEventType("user.created")).toBe("user_created");
  });
});
