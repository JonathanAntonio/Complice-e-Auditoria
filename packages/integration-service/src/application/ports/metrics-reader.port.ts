export interface IMetricsReader {
  contentType: string;
  metrics(): Promise<string>;
}
