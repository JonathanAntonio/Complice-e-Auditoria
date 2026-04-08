import { Request, Response, NextFunction } from "express";
import { CreateItemUseCase } from "../../../application/use-cases/create-item.use-case";
import { ListItemsUseCase } from "../../../application/use-cases/list-items.use-case";
import { UpdateItemUseCase } from "../../../application/use-cases/update-item.use-case";

export class ItemController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly listItemsUseCase: ListItemsUseCase,
    private readonly updateItemUseCase: UpdateItemUseCase
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = toCreateItemDto(req.body);
      const result = await this.createItemUseCase.execute(dto);
      res.status(201).json(toViolationResponse(result));
    } catch (err) {
      next(err);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.listItemsUseCase.execute();
      res.json(items.map((item) => toViolationResponse(item)));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = toCreateItemDto(req.body);
      const violationId = typeof req.params.violationId === "string" ? req.params.violationId : "";
      const result = await this.updateItemUseCase.execute(violationId, dto);
      res.status(200).json(toViolationResponse(result));
    } catch (err) {
      next(err);
    }
  };

  testPermission = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ ok: true, permission: "compliance.test.access" });
    } catch (err) {
      next(err);
    }
  };
}

function toCreateItemDto(raw: unknown): { name: string; priceAmount: number; priceCurrency: "BRL" } {
  const payload = raw as { title: string; severity?: string };
  const normalizedSeverity = typeof payload.severity === "string" ? payload.severity.toLowerCase() : "media";
  const severityScore = normalizedSeverity === "alta" ? 300 : normalizedSeverity === "baixa" ? 100 : 200;
  return {
    name: payload.title,
    priceAmount: severityScore,
    priceCurrency: "BRL",
  };
}

function toViolationResponse(raw: unknown): {
  id: string;
  title: string;
  severity: "baixa" | "media" | "alta";
  status: "aberta";
  createdAt: string;
} {
  const payload = raw as { id: string; name: string; priceAmount: number; createdAt: string };
  const severity = payload.priceAmount >= 300 ? "alta" : payload.priceAmount <= 100 ? "baixa" : "media";
  return {
    id: payload.id,
    title: payload.name,
    severity,
    status: "aberta",
    createdAt: payload.createdAt,
  };
}
