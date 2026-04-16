import { randomUUID } from "crypto";
import { z } from "zod";

const dispatchSchema = z.object({
  channel: z.enum(["email", "webhook"]),
  recipient: z.string().trim().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string().trim().min(1).max(2000),
  maxRetries: z.coerce.number().int().min(1).max(3).default(3),
  forceFailAttempts: z.coerce.number().int().min(0).max(3).default(0),
});

export interface NotificationLog {
  id: string;
  channel: "email" | "webhook";
  recipient: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "sent" | "failed" | "dead_letter";
  attempts: number;
  createdAtUTC: string;
  deliveredAtUTC?: string;
  lastError?: string;
}

export class NotificationDispatchService {
  private readonly logs = new Map<string, NotificationLog>();

  dispatch(raw: unknown): NotificationLog {
    const parsed = dispatchSchema.parse(raw);
    const id = randomUUID();
    const createdAtUTC = new Date().toISOString();

    let attempts = 0;
    let sent = false;
    let lastError: string | undefined;

    while (!sent && attempts < parsed.maxRetries) {
      attempts += 1;
      if (attempts <= parsed.forceFailAttempts) {
        lastError = `simulated_failure_attempt_${attempts}`;
        continue;
      }
      sent = true;
    }

    const log: NotificationLog = {
      id,
      channel: parsed.channel,
      recipient: parsed.recipient,
      severity: parsed.severity,
      status: sent ? "sent" : attempts >= parsed.maxRetries ? "dead_letter" : "failed",
      attempts,
      createdAtUTC,
      deliveredAtUTC: sent ? new Date().toISOString() : undefined,
      lastError: sent ? undefined : (lastError ?? "delivery_failed"),
    };

    this.logs.set(id, log);
    return log;
  }

  list(): NotificationLog[] {
    return [...this.logs.values()].sort((a, b) => b.createdAtUTC.localeCompare(a.createdAtUTC));
  }
}
