import type { HttpErrorMapping } from "@lframework/shared";

export function mapIntegrationErrorToHttp(err: unknown): HttpErrorMapping {
  if (typeof err === "object" && err !== null) {
    const candidate = err as { statusCode?: unknown; status?: unknown; message?: unknown; name?: unknown; code?: unknown };
    const statusCode = typeof candidate.statusCode === "number"
      ? candidate.statusCode
      : (typeof candidate.status === "number" ? candidate.status : undefined);
    if (statusCode && statusCode >= 400 && statusCode <= 599) {
      return {
        statusCode,
        message: statusCode >= 500
          ? "Internal server error"
          : (typeof candidate.message === "string" && candidate.message.length > 0
            ? candidate.message
            : "Request failed"),
      };
    }

    if (candidate.name === "ZodError") {
      return { statusCode: 400, message: "Invalid request payload" };
    }
    if (candidate.code === "P2002") {
      return { statusCode: 409, message: "Conflict" };
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("unauthorized")) return { statusCode: 401, message: "Unauthorized" };
    if (msg.includes("forbidden")) return { statusCode: 403, message: "Forbidden" };
    if (msg.includes("not found")) return { statusCode: 404, message: "Not found" };
    if (msg.includes("validation")) return { statusCode: 400, message: "Invalid request payload" };
  }

  return {
    statusCode: 500,
    message: "Internal server error",
  };
}
