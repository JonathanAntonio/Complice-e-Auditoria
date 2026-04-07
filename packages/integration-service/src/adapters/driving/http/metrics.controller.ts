import type { Request, Response } from "express";
import { GetMetricsUseCase } from "../../../application/use-cases/get-metrics.use-case";

export class MetricsController {
  constructor(private readonly getMetricsUseCase: GetMetricsUseCase) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getMetricsUseCase.execute();
    res.set("Content-Type", result.contentType);
    res.end(result.body);
  };
}
