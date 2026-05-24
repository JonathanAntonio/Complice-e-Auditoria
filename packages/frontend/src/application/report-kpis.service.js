import { requestBffReporting } from "../infrastructure/http/bff-reporting.api";
import { parseReportKpisDto, parseReportKpisQueryDto } from "./dtos/report-kpis.dto";

function toSearchParams(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const raw = params.toString();
  return raw.length > 0 ? `?${raw}` : "";
}

export async function getReportKpis(query = {}) {
  const dto = parseReportKpisQueryDto(query);
  const payload = await requestBffReporting(`/kpis${toSearchParams(dto)}`, {
    defaultErrorMessage: "Falha ao carregar indicadores de governança.",
  });
  return parseReportKpisDto(payload);
}
