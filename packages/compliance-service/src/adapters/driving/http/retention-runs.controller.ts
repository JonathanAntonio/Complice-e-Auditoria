import type { NextFunction, Request, Response } from "express";
import { sendValidationError } from "@lframework/shared";
import { ZodError } from "zod";
import { parseListRetentionRunsQueryDto } from "../../../application/dtos";
import type { ListRetentionRunsUseCase } from "../../../application/use-cases";

export class RetentionRunsController {
  constructor(private readonly listRetentionRunsUseCase: ListRetentionRunsUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = parseListRetentionRunsQueryDto(req.query);
      const result = await this.listRetentionRunsUseCase.execute(query);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        sendValidationError(res, err);
        return;
      }
      next(err);
    }
  };
}
