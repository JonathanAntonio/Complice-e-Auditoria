export class UpstreamHttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "UpstreamHttpError";
  }
}
