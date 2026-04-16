import { logger } from "@lframework/shared";
import type { PrismaClient } from "../../../generated/prisma-client";
import type { IOutboxRepository } from "../ports/outbox-repository.port";
import { createSecurityAuditEvent, SECURITY_AUDIT_EVENTS } from "../security-audit";

export interface AnonymizeInactiveUsersInput {
  retentionDays: number;
  batchSize: number;
}

export interface AnonymizeInactiveUsersResult {
  scanned: number;
  anonymized: number;
  cutoffIso: string;
}

interface CandidateRow {
  id: string;
  email: string;
}

function buildAnonymizedEmail(userId: string): string {
  return `anon+${userId}@redacted.local`;
}

function isAlreadyAnonymized(email: string): boolean {
  return email.endsWith("@redacted.local");
}

export class AnonymizeInactiveUsersUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly outboxRepository: IOutboxRepository
  ) {}

  async execute(input: AnonymizeInactiveUsersInput): Promise<AnonymizeInactiveUsersResult> {
    const retentionDays = Math.max(730, Math.floor(input.retentionDays));
    const batchSize = Math.max(1, Math.min(500, Math.floor(input.batchSize)));
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const candidates = await this.prisma.$queryRaw<Array<CandidateRow>>`
      SELECT u."id", u."email"
      FROM "users" u
      WHERE u."is_active" = false
        AND u."deactivated_at" IS NOT NULL
        AND u."deactivated_at" <= ${cutoff}
      ORDER BY u."deactivated_at" ASC
      LIMIT ${batchSize}
    `;

    let anonymized = 0;
    for (const candidate of candidates) {
      if (isAlreadyAnonymized(candidate.email)) {
        continue;
      }

      const anonymizedEmail = buildAnonymizedEmail(candidate.id);
      const correlationId = `retention-${candidate.id}-${Date.now()}`;

      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          UPDATE "users"
          SET
            "email" = ${anonymizedEmail},
            "name" = ${"Anonymized User"},
            "authorization_version" = "authorization_version" + 1
          WHERE "id" = ${candidate.id}
            AND "is_active" = false
        `;

        await this.outboxRepository.append(
          createSecurityAuditEvent(SECURITY_AUDIT_EVENTS.USER_DATA_ANONYMIZED, {
            actorUserId: "retention-job",
            targetUserId: candidate.id,
            reason: "inactive_user_retention",
            previousEmail: candidate.email,
            anonymizedEmail,
            cutoff: cutoff.toISOString(),
            occurredAt: new Date().toISOString(),
            correlationId,
          }),
          tx
        );
      });

      anonymized += 1;
    }

    const result = {
      scanned: candidates.length,
      anonymized,
      cutoffIso: cutoff.toISOString(),
    };
    logger.info({ result }, "Inactive user anonymization sweep finished");
    return result;
  }
}
