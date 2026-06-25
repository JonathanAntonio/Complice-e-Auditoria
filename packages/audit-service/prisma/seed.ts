import { PrismaClient } from "../generated/prisma-client";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3_600_000);
}

const SERVICES = ["compliance-service", "audit-service", "identity-service", "risk-analysis-service", "integration-service", "bff-service"];
const ACTORS = [
  { id: "user-admin-001",      type: "user" },
  { id: "user-compliance-002", type: "user" },
  { id: "user-auditor-003",    type: "user" },
  { id: "user-gestor-004",     type: "user" },
  { id: "system",              type: "system" },
];

const EVENTS = [
  { eventType: "user.login",                 severity: "low",      service: "identity-service" },
  { eventType: "user.login",                 severity: "low",      service: "identity-service" },
  { eventType: "user.login.failed",          severity: "high",     service: "identity-service" },
  { eventType: "user.password_changed",      severity: "medium",   service: "identity-service" },
  { eventType: "user.role_assigned",         severity: "high",     service: "identity-service" },
  { eventType: "user.deactivated",           severity: "high",     service: "identity-service" },
  { eventType: "compliance.violation.created",  severity: "high",  service: "compliance-service" },
  { eventType: "compliance.violation.created",  severity: "critical", service: "compliance-service" },
  { eventType: "compliance.violation.updated",  severity: "medium", service: "compliance-service" },
  { eventType: "compliance.violation.resolved", severity: "low",   service: "compliance-service" },
  { eventType: "compliance.violation.dismissed",severity: "medium", service: "compliance-service" },
  { eventType: "audit.retention.run.started",   severity: "low",   service: "audit-service" },
  { eventType: "audit.retention.run.completed", severity: "low",   service: "audit-service" },
  { eventType: "audit.log.exported",            severity: "medium",service: "audit-service" },
  { eventType: "risk.event.ingested",           severity: "high",  service: "risk-analysis-service" },
  { eventType: "risk.event.ingested",           severity: "critical", service: "risk-analysis-service" },
  { eventType: "risk.score.updated",            severity: "medium",service: "risk-analysis-service" },
  { eventType: "integration.event.published",   severity: "low",   service: "integration-service" },
  { eventType: "integration.event.failed",      severity: "high",  service: "integration-service" },
  { eventType: "notification.dispatched",       severity: "low",   service: "bff-service" },
  { eventType: "notification.failed",           severity: "high",  service: "bff-service" },
  { eventType: "report.export.created",         severity: "low",   service: "bff-service" },
  { eventType: "access_review",                 severity: "medium",service: "compliance-service" },
  { eventType: "policy_violation",              severity: "critical", service: "compliance-service" },
  { eventType: "invoice_updated",               severity: "low",   service: "integration-service" },
  { eventType: "user.login",                    severity: "low",   service: "identity-service" },
  { eventType: "compliance.violation.created",  severity: "high",  service: "compliance-service" },
  { eventType: "risk.event.ingested",           severity: "high",  service: "risk-analysis-service" },
  { eventType: "integration.event.published",   severity: "low",   service: "integration-service" },
  { eventType: "audit.log.exported",            severity: "low",   service: "audit-service" },
  { eventType: "user.login.failed",             severity: "high",  service: "identity-service" },
  { eventType: "policy_violation",              severity: "high",  service: "compliance-service" },
  { eventType: "access_review",                 severity: "low",   service: "audit-service" },
  { eventType: "notification.dispatched",       severity: "low",   service: "bff-service" },
  { eventType: "risk.score.updated",            severity: "critical", service: "risk-analysis-service" },
  { eventType: "user.role_assigned",            severity: "medium",service: "identity-service" },
  { eventType: "compliance.violation.updated",  severity: "medium",service: "compliance-service" },
  { eventType: "invoice_updated",               severity: "low",   service: "integration-service" },
  { eventType: "report.export.created",         severity: "low",   service: "bff-service" },
  { eventType: "audit.retention.run.completed", severity: "low",   service: "audit-service" },
  { eventType: "user.password_changed",         severity: "medium",service: "identity-service" },
  { eventType: "integration.event.failed",      severity: "critical", service: "integration-service" },
  { eventType: "compliance.violation.created",  severity: "critical", service: "compliance-service" },
  { eventType: "risk.event.ingested",           severity: "medium",service: "risk-analysis-service" },
  { eventType: "notification.failed",           severity: "high",  service: "bff-service" },
  { eventType: "access_review",                 severity: "high",  service: "compliance-service" },
  { eventType: "user.deactivated",              severity: "high",  service: "identity-service" },
  { eventType: "audit.log.exported",            severity: "medium",service: "audit-service" },
  { eventType: "policy_violation",              severity: "critical",service: "compliance-service" },
  { eventType: "user.login",                    severity: "low",   service: "identity-service" },
  { eventType: "integration.event.published",   severity: "low",   service: "integration-service" },
  { eventType: "risk.score.updated",            severity: "high",  service: "risk-analysis-service" },
  { eventType: "compliance.violation.dismissed",severity: "low",   service: "compliance-service" },
  { eventType: "notification.dispatched",       severity: "low",   service: "bff-service" },
  { eventType: "report.export.created",         severity: "low",   service: "bff-service" },
  { eventType: "user.login.failed",             severity: "critical", service: "identity-service" },
  { eventType: "compliance.violation.resolved", severity: "low",   service: "compliance-service" },
  { eventType: "audit.retention.run.started",   severity: "low",   service: "audit-service" },
  { eventType: "invoice_updated",               severity: "low",   service: "integration-service" },
  { eventType: "risk.event.ingested",           severity: "critical", service: "risk-analysis-service" },
];

async function main() {
  console.log("🌱 Seeding audit-service...");

  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const actor = ACTORS[i % ACTORS.length];
    await prisma.auditLogModel.create({
      data: {
        eventId: randomUUID(),
        eventType: e.eventType,
        occurredAtUTC: hoursAgo(EVENTS.length - i),
        sourceService: e.service,
        correlationId: randomUUID(),
        severity: e.severity,
        actorId: actor.id,
        actorType: actor.type,
        payload: {
          action: e.eventType,
          timestamp: hoursAgo(EVENTS.length - i).toISOString(),
        },
      },
    });
  }

  // Seed retention runs
  await prisma.auditRetentionRunModel.createMany({
    data: [
      {
        status: "success",
        retentionDays: 1825,
        cutoffAt: new Date(Date.now() - 1825 * 86_400_000),
        startedAt: hoursAgo(72),
        finishedAt: hoursAgo(71),
        scannedCount: 4200,
        eligibleCount: 0,
        monitorOnlyCount: 0,
      },
      {
        status: "success",
        retentionDays: 1825,
        cutoffAt: new Date(Date.now() - 1825 * 86_400_000),
        startedAt: hoursAgo(24),
        finishedAt: hoursAgo(23),
        scannedCount: 4261,
        eligibleCount: 0,
        monitorOnlyCount: 0,
      },
    ],
  });

  console.log(`  ✓ ${EVENTS.length} audit logs`);
  console.log("  ✓ 2 retention runs");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
