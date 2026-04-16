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
      const dto = toUpdateItemDto(req.body);
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

function toUpdateItemDto(raw: unknown): {
  name?: string;
  priceAmount?: number;
  priceCurrency?: "BRL";
  status?: "aberta" | "em_analise" | "resolvida" | "dispensada";
} {
  const payload = raw as { title?: string; severity?: string; status?: string };
  const hasSeverity = typeof payload.severity === "string";
  const normalizedSeverity = hasSeverity ? payload.severity!.toLowerCase() : undefined;
  const severityScore = normalizedSeverity === "alta" ? 300 : normalizedSeverity === "baixa" ? 100 : 200;

  return {
    name: typeof payload.title === "string" ? payload.title : undefined,
    priceAmount: hasSeverity ? severityScore : undefined,
    priceCurrency: hasSeverity ? "BRL" : undefined,
    status:
      payload.status === "aberta" ||
      payload.status === "em_analise" ||
      payload.status === "resolvida" ||
      payload.status === "dispensada"
        ? payload.status
        : undefined,
  };
}

function toViolationResponse(raw: unknown): {
  id: string;
  title: string;
  severity: "baixa" | "media" | "alta";
  status: "aberta" | "em_analise" | "resolvida" | "dispensada";
  resolvedAt: string | null;
  dismissedAt: string | null;
  retentionUntil: string | null;
  createdAt: string;
} {
  const payload = raw as {
    id: string;
    name: string;
    priceAmount: number;
    status: "aberta" | "em_analise" | "resolvida" | "dispensada";
    resolvedAt: string | null;
    dismissedAt: string | null;
    retentionUntil: string | null;
    createdAt: string;
  };
  const severity = payload.priceAmount >= 300 ? "alta" : payload.priceAmount <= 100 ? "baixa" : "media";
  return {
    id: payload.id,
    title: payload.name,
    severity,
    status: payload.status ?? "aberta",
    resolvedAt: payload.resolvedAt ?? null,
    dismissedAt: payload.dismissedAt ?? null,
    retentionUntil: payload.retentionUntil ?? null,
    createdAt: payload.createdAt,
  };
}
