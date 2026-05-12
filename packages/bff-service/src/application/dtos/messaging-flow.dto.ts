export interface MessagingFlowSnapshotDto {
  generatedAtUTC: string;
  flowNodes: Array<{ key: string; label: string; description: string }>;
  summary: {
    integrationEventsSample: number;
    consumerEventsSample: number;
    failedNotifications: number;
    deadLetterNotifications: number;
    failureRatePercent: number;
    activeServices: number;
    uniqueCorrelationIds: number;
  };
  topEventTypes: Array<{ eventType: string; count: number }>;
  consumers: Array<{
    service: string;
    processedSample: number;
    failed: number;
    deadLetter: number;
    failureRate: number;
  }>;
  recentAuditEvents: Array<{
    eventId: string;
    eventType: string;
    occurredAtUTC: string;
    sourceService: string;
    correlationId: string;
  }>;
  recentFailures: Array<{
    id: string;
    channel: string;
    recipient: string;
    status: "sent" | "failed" | "dead_letter";
    attempts: number;
    createdAtUTC: string;
  }>;
}

export interface MessagingFlowQueryDto {
  sourceService?: string;
  eventType?: string;
  correlationId?: string;
  notificationStatus?: "sent" | "failed" | "dead_letter";
  onlyFailures?: boolean;
  auditLimit?: number;
  failuresLimit?: number;
}

export function parseMessagingFlowSnapshotDto(raw: unknown): MessagingFlowSnapshotDto {
  if (!raw || typeof raw !== "object") throw new Error("Invalid messaging flow response");
  const payload = raw as MessagingFlowSnapshotDto;
  if (typeof payload.generatedAtUTC !== "string") throw new Error("Invalid messaging flow response");
  if (!Array.isArray(payload.flowNodes)) throw new Error("Invalid messaging flow response");
  if (!payload.summary || typeof payload.summary !== "object") throw new Error("Invalid messaging flow response");
  if (!Array.isArray(payload.consumers)) throw new Error("Invalid messaging flow response");
  if (!Array.isArray(payload.recentAuditEvents)) throw new Error("Invalid messaging flow response");
  if (!Array.isArray(payload.recentFailures)) throw new Error("Invalid messaging flow response");
  return payload;
}
