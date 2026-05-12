import type {
  AuditLogItem,
  NotificationLogItem,
  NotificationLogsResponse,
} from "../adapters/driven/http/downstream.client";
import { DownstreamClient } from "../adapters/driven/http/downstream.client";

const CONSUMER_SERVICES = [
  "notification-service",
  "compliance-service",
  "risk-analysis-service",
  "audit-service",
];

export interface MessagingFlowSnapshot {
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
  recentAuditEvents: AuditLogItem[];
  recentFailures: NotificationLogItem[];
}

export interface MessagingFlowFilters {
  sourceService?: string;
  eventType?: string;
  correlationId?: string;
  notificationStatus?: "sent" | "failed" | "dead_letter";
  onlyFailures?: boolean;
  auditLimit?: number;
  failuresLimit?: number;
}

export class MessagingFlowService {
  constructor(private readonly downstreamClient: DownstreamClient) {}

  async getSnapshot(
    authorization: string | undefined,
    filters: MessagingFlowFilters = {},
  ): Promise<MessagingFlowSnapshot> {
    const [auditLogs, notificationLogs] = await Promise.all([
      this.downstreamClient.fetchAuditLogs(authorization, filters.auditLimit ?? 120),
      this.downstreamClient.fetchNotificationLogs(authorization),
    ]);

    const auditItems = applyAuditFilters(auditLogs.items ?? [], filters);
    const notificationItems = applyNotificationFilters(notificationLogs.items ?? [], filters);
    const deadLetterNotifications = notificationItems.filter((item) => item.status === "dead_letter").length;
    const failedNotifications = notificationItems.filter((item) => item.status === "failed").length;
    const integrationEvents = auditItems.filter((item) => this.isIntegrationEvent(item));
    const totalNotifications = notificationItems.length;
    const failureRatePercent = totalNotifications > 0
      ? Number((((failedNotifications + deadLetterNotifications) / totalNotifications) * 100).toFixed(2))
      : 0;
    const activeServices = new Set(auditItems.map((item) => item.sourceService)).size;
    const uniqueCorrelationIds = new Set(auditItems.map((item) => item.correlationId)).size;
    const topEventTypes = toTopEventTypes(auditItems);

    const consumers = buildConsumerMetrics(auditItems, notificationLogs);
    const consumerEventsSample = consumers.reduce((sum, item) => sum + item.processedSample, 0);

    return {
      generatedAtUTC: new Date().toISOString(),
      flowNodes: [
        { key: "producers", label: "Produtores", description: "identity-service e bff-service publicam eventos." },
        { key: "broker", label: "Broker (RabbitMQ)", description: "Mensagens roteadas por exchanges e filas." },
        { key: "consumers", label: "Consumidores", description: "Serviços processam eventos por domínio." },
        { key: "dlq", label: "Retry + DLQ", description: "Falhas passam por retentativas e podem cair em dead-letter." },
      ],
      summary: {
        integrationEventsSample: integrationEvents.length,
        consumerEventsSample,
        failedNotifications,
        deadLetterNotifications,
        failureRatePercent,
        activeServices,
        uniqueCorrelationIds,
      },
      topEventTypes,
      consumers,
      recentAuditEvents: auditItems.slice(0, Math.max(1, filters.auditLimit ?? 120)),
      recentFailures: notificationItems.slice(0, Math.max(1, filters.failuresLimit ?? 40)),
    };
  }

  private isIntegrationEvent(item: AuditLogItem): boolean {
    return item.sourceService.includes("integration") || item.eventType.includes("integration");
  }
}

function applyAuditFilters(items: AuditLogItem[], filters: MessagingFlowFilters): AuditLogItem[] {
  return items.filter((item) => {
    if (filters.sourceService && item.sourceService !== filters.sourceService) return false;
    if (filters.eventType && !item.eventType.toLowerCase().includes(filters.eventType.toLowerCase())) return false;
    if (filters.correlationId && item.correlationId !== filters.correlationId) return false;
    return true;
  });
}

function applyNotificationFilters(items: NotificationLogItem[], filters: MessagingFlowFilters): NotificationLogItem[] {
  return items.filter((item) => {
    if (filters.notificationStatus && item.status !== filters.notificationStatus) return false;
    if (filters.onlyFailures && !(item.status === "failed" || item.status === "dead_letter")) return false;
    return true;
  });
}

function toTopEventTypes(items: AuditLogItem[]): Array<{ eventType: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.eventType, (counts.get(item.eventType) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eventType, count]) => ({ eventType, count }));
}

function buildConsumerMetrics(
  auditItems: AuditLogItem[],
  notificationLogs: NotificationLogsResponse,
): MessagingFlowSnapshot["consumers"] {
  const notifications = notificationLogs.items ?? [];

  return CONSUMER_SERVICES.map((service) => {
    const processedSample = auditItems.filter((item) => item.sourceService === service).length;
    const related = service === "notification-service" ? notifications : [];
    const failed = related.filter((item) => item.status === "failed").length;
    const deadLetter = related.filter((item) => item.status === "dead_letter").length;
    const total = related.length;
    const failureRate = total > 0 ? ((failed + deadLetter) / total) * 100 : 0;

    return {
      service,
      processedSample,
      failed,
      deadLetter,
      failureRate: Number(failureRate.toFixed(2)),
    };
  });
}
