export const VIOLATION_STATUS = {
  ABERTA: "aberta",
  EM_ANALISE: "em_analise",
  RESOLVIDA: "resolvida",
  DISPENSADA: "dispensada",
} as const;

export type ViolationStatus = (typeof VIOLATION_STATUS)[keyof typeof VIOLATION_STATUS];

export const FINAL_VIOLATION_STATUSES: ReadonlyArray<ViolationStatus> = [
  VIOLATION_STATUS.RESOLVIDA,
  VIOLATION_STATUS.DISPENSADA,
];
