import { requestBffHealth } from "../infrastructure/http/bff-health.api";

export async function getBffHealth() {
  const payload = await requestBffHealth("/health", {
    defaultErrorMessage: "BFF não respondeu ao health check.",
  });
  return payload;
}
