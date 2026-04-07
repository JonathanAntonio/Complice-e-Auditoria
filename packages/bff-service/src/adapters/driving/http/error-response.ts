import type { Response } from "express";

export function sendJsonError(res: Response, statusCode: number, message: string): void {
  res.status(statusCode).json({ error: message, message });
}

export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
