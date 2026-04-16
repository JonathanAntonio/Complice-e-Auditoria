export interface RetentionRunItemDto {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  retentionDays: number;
  cutoffAt: string;
  scannedCount: number;
  eligibleCount: number;
  monitorOnlyCount: number;
  errorMessage: string | null;
}

export interface RetentionRunListResponseDto {
  items: RetentionRunItemDto[];
  page: number;
  pageSize: number;
  total: number;
}
