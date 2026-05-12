import type { NextFunction, Request, Response } from "express";
import { sendValidationError, eventEnvelopeV1Schema } from "@lframework/shared";
import { ZodError } from "zod";
import { parseListAuditLogsQueryDto } from "../../../application/dtos/list-audit-logs-query.dto";
import { parseListRetentionRunsQueryDto } from "../../../application/dtos/list-retention-runs-query.dto";
import type { ListAuditLogsUseCase } from "../../../application/use-cases/list-audit-logs.use-case";
import type { ListRetentionRunsUseCase } from "../../../application/use-cases/list-retention-runs.use-case";
import type { IngestAuditEventUseCase } from "../../../application/use-cases/ingest-audit-event.use-case";

export class AuditLogsController {
  constructor(
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly listRetentionRunsUseCase: ListRetentionRunsUseCase,
    private readonly ingestAuditEventUseCase: IngestAuditEventUseCase
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseListAuditLogsQueryDto(req.query);
      const response = await this.listAuditLogsUseCase.execute(parsed);
      res.json(response);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  };

  listRetentionRuns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseListRetentionRunsQueryDto(req.query);
      const response = await this.listRetentionRunsUseCase.execute(parsed);
      res.json(response);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  };

  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const envelope = eventEnvelopeV1Schema.parse(req.body);
      await this.ingestAuditEventUseCase.execute(envelope);
      res.status(202).send();
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  };
}
