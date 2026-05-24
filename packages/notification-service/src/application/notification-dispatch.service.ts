import { randomUUID } from "crypto";
import { z } from "zod";
import type { NotificationPreferencesService } from "./notification-preferences.service";

const dispatchSchema = z.object({
  channel: z.enum(["email", "webhook"]),
  recipient: z.string().trim().min(1).optional(),
  scopeOwner: z.string().trim().min(1).optional(),
  areaManager: z.string().trim().min(1).optional(),
  complianceOfficer: z.string().trim().min(1).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string().trim().min(1).max(2000),
  maxRetries: z.coerce.number().int().min(1).max(3).default(3),
  forceFailAttempts: z.coerce.number().int().min(0).max(3).default(0),
}).superRefine((value, ctx) => {
  if (value.recipient) return;
  if (!value.scopeOwner) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "recipient or scopeOwner is required",
      path: ["recipient"],
    });
  }
  if ((value.severity === "high" || value.severity === "critical") && !value.areaManager) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "areaManager is required for high/critical severity",
      path: ["areaManager"],
    });
  }
  if (value.severity === "critical" && !value.complianceOfficer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "complianceOfficer is required for critical severity",
      path: ["complianceOfficer"],
    });
  }
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
  slaTargetSeconds?: number;
  slaDeadlineUTC?: string;
  slaBreached?: boolean;
}

export class NotificationDispatchService {
  private readonly logs = new Map<string, NotificationLog>();
  constructor(private readonly preferencesService?: NotificationPreferencesService) {}

  async dispatch(raw: unknown): Promise<NotificationLog | undefined> {
    return (await this.dispatchMany(raw))[0];
  }

  async dispatchMany(raw: unknown): Promise<NotificationLog[]> {
    const parsed = dispatchSchema.parse(raw);
    const recipients = resolveRecipients(parsed);
    const logsByRecipient = await Promise.all(recipients.map(async (recipient) => {
      const preference = this.preferencesService ? await this.preferencesService.get(recipient) : null;
      const channelAllowed =
        !preference || preference.channels.includes(parsed.channel);
      const mutedByPreference =
        Boolean(preference?.muteLowMedium) &&
        (parsed.severity === "low" || parsed.severity === "medium");
      if ((!channelAllowed || mutedByPreference) && (parsed.severity === "low" || parsed.severity === "medium")) {
        return null;
      }
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
        recipient,
        severity: parsed.severity,
        status: sent ? "sent" : attempts >= parsed.maxRetries ? "dead_letter" : "failed",
        attempts,
        createdAtUTC,
        deliveredAtUTC: sent ? new Date().toISOString() : undefined,
        lastError: sent ? undefined : (lastError ?? "delivery_failed"),
      };
      if (parsed.severity === "critical") {
        const targetSeconds = 300;
        const deadline = new Date(new Date(createdAtUTC).getTime() + targetSeconds * 1000).toISOString();
        const deliveredAtUTC = log.deliveredAtUTC;
        const deliveredTs = deliveredAtUTC ? new Date(deliveredAtUTC).getTime() : Number.POSITIVE_INFINITY;
        const deadlineTs = new Date(deadline).getTime();
        log.slaTargetSeconds = targetSeconds;
        log.slaDeadlineUTC = deadline;
        log.slaBreached = deliveredTs > deadlineTs;
      }

      this.logs.set(id, log);
      return log;
    }));
    return logsByRecipient.filter((item): item is NotificationLog => item !== null);
  }

  list(): NotificationLog[] {
    return [...this.logs.values()].sort((a, b) => b.createdAtUTC.localeCompare(a.createdAtUTC));
  }
}

function resolveRecipients(input: {
  recipient?: string;
  scopeOwner?: string;
  areaManager?: string;
  complianceOfficer?: string;
  severity: "low" | "medium" | "high" | "critical";
}): string[] {
  const recipients = new Set<string>();
  if (input.recipient) recipients.add(input.recipient);
  if (!input.recipient && input.scopeOwner) recipients.add(input.scopeOwner);
  if (input.severity === "high" || input.severity === "critical") {
    if (input.areaManager) recipients.add(input.areaManager);
  }
  if (input.severity === "critical" && input.complianceOfficer) {
    recipients.add(input.complianceOfficer);
  }
  return [...recipients];
}
