import type { IMetricsReader } from "../../../application/ports";
import { IntegrationMetrics } from "../../../application/metrics";

export class PrometheusMetricsReaderAdapter implements IMetricsReader {
  constructor(private readonly integrationMetrics: IntegrationMetrics) {}

  get contentType(): string {
    return this.integrationMetrics.registry.contentType;
  }

  async metrics(): Promise<string> {
    return this.integrationMetrics.registry.metrics();
  }
}
