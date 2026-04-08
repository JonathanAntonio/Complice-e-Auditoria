export function mapAuditErrorToHttp(error: unknown): { statusCode: number; message: string } | null {
  if (error instanceof Error && error.message.includes("Invalid Date")) {
    return {
      statusCode: 400,
      message: "Invalid request",
    };
  }
  return null;
}
