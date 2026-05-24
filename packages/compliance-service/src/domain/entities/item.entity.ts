import { Money } from "../value-objects/money.vo";
import {
  FINAL_VIOLATION_STATUSES,
  VIOLATION_STATUS,
  type ViolationStatus,
} from "../types";

/**
 * Entidade de domínio: Item (produto do catálogo).
 */
export class Item {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _price: Money,
    private _status: ViolationStatus,
    private _resolvedAt: Date | null,
    private _dismissedAt: Date | null,
    private _dismissalJustification: string | null,
    private _dismissalApprovedBy: string | null,
    private _retentionUntil: Date | null,
    private readonly _createdAt: Date
  ) {}

  static create(id: string, name: string, price: Money): Item {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }
    return new Item(id, name.trim(), price, VIOLATION_STATUS.ABERTA, null, null, null, null, null, new Date());
  }

  static reconstitute(
    id: string,
    name: string,
    amount: number,
    currency: string,
    createdAt: Date,
    status: ViolationStatus = VIOLATION_STATUS.ABERTA,
    resolvedAt: Date | null = null,
    dismissedAt: Date | null = null,
    dismissalJustification: string | null = null,
    dismissalApprovedBy: string | null = null,
    retentionUntil: Date | null = null
  ): Item {
    return new Item(
      id,
      name,
      Money.create(amount, currency),
      status,
      resolvedAt,
      dismissedAt,
      dismissalJustification,
      dismissalApprovedBy,
      retentionUntil,
      createdAt
    );
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): Money {
    return this._price;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get status(): ViolationStatus {
    return this._status;
  }

  get resolvedAt(): Date | null {
    return this._resolvedAt ? new Date(this._resolvedAt.getTime()) : null;
  }

  get dismissedAt(): Date | null {
    return this._dismissedAt ? new Date(this._dismissedAt.getTime()) : null;
  }

  get retentionUntil(): Date | null {
    return this._retentionUntil ? new Date(this._retentionUntil.getTime()) : null;
  }

  get dismissalJustification(): string | null {
    return this._dismissalJustification;
  }

  get dismissalApprovedBy(): string | null {
    return this._dismissalApprovedBy;
  }

  transitionStatus(
    nextStatus: ViolationStatus,
    at: Date,
    options: { dismissalJustification?: string; dismissalApprovedBy?: string; isCritical?: boolean } = {}
  ): void {
    if (this._status === nextStatus) {
      return;
    }

    if (FINAL_VIOLATION_STATUSES.includes(this._status)) {
      throw new Error("Finalized violation cannot transition to another status");
    }

    if (this._status === VIOLATION_STATUS.ABERTA && nextStatus !== VIOLATION_STATUS.EM_ANALISE) {
      throw new Error("Open violation can only transition to em_analise");
    }

    if (
      this._status === VIOLATION_STATUS.EM_ANALISE &&
      !FINAL_VIOLATION_STATUSES.includes(nextStatus)
    ) {
      throw new Error("Violation in analysis can only transition to resolvida or dispensada");
    }

    this._status = nextStatus;
    if (nextStatus === VIOLATION_STATUS.RESOLVIDA) {
      this._resolvedAt = new Date(at.getTime());
      this._dismissedAt = null;
      this._dismissalJustification = null;
      this._dismissalApprovedBy = null;
      return;
    }

    if (nextStatus === VIOLATION_STATUS.DISPENSADA) {
      const justification = options.dismissalJustification?.trim();
      if (!justification) {
        throw new Error("Dismissed violation requires justification");
      }
      if (options.isCritical && !options.dismissalApprovedBy?.trim()) {
        throw new Error("Critical violation dismissal requires approval");
      }
      this._dismissedAt = new Date(at.getTime());
      this._resolvedAt = null;
      this._dismissalJustification = justification;
      this._dismissalApprovedBy = options.dismissalApprovedBy?.trim() ?? null;
      return;
    }

    this._resolvedAt = null;
    this._dismissedAt = null;
    this._dismissalJustification = null;
    this._dismissalApprovedBy = null;
  }

  setRetentionUntil(value: Date | null): void {
    this._retentionUntil = value ? new Date(value.getTime()) : null;
  }
}
