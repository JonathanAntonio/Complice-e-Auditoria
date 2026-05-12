import type { NextFunction, Request, Response } from "express";
import { sendValidationError, eventEnvelopeV1Schema } from "@lframework/shared";
import { ZodError } from "zod";
import { parseListAuditLogsQueryDto, parseListRetentionRunsQueryDto } from "../../../application/dtos";
import type {
  IngestAuditEventUseCase,
  ListAuditLogsUseCase,
  ListRetentionRunsUseCase,
} from "../../../application/use-cases";

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
