import type { IMetricsReader } from "../ports/metrics-reader.port";

export class GetMetricsUseCase {
  constructor(private readonly metricsReader: IMetricsReader) {}

  async execute(): Promise<{ contentType: string; body: string }> {
    return {
      contentType: this.metricsReader.contentType,
      body: await this.metricsReader.metrics(),
    };
  }
}
