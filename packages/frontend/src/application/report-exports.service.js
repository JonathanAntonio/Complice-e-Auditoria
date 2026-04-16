import { downloadBffReportExport, requestBffReporting } from "../infrastructure/http/bff-reporting.api";
import { parseCreateReportExportInputDto, parseReportExportJobDto } from "./dtos/report-export.dto";

export async function createReportExport(input) {
  const dto = parseCreateReportExportInputDto(input);
  const payload = await requestBffReporting("/exports", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao criar exportação.",
  });
  return parseReportExportJobDto(payload);
}

export async function getReportExport(exportId) {
  if (typeof exportId !== "string" || exportId.trim().length === 0) {
    throw new Error("ID da exportação inválido.");
  }

  const payload = await requestBffReporting(`/exports/${encodeURIComponent(exportId.trim())}`, {
    defaultErrorMessage: "Falha ao consultar exportação.",
  });
  return parseReportExportJobDto(payload);
}

export async function downloadReportExport(exportId) {
  const file = await downloadBffReportExport(exportId);
  return {
    blob: file.blob,
    contentType: file.contentType,
    filename: parseFilenameFromContentDisposition(file.contentDisposition),
  };
}

export async function exportAndDownloadReport(input) {
  const job = await createReportExport(input);
  const file = await downloadReportExport(job.id);

  return {
    job,
    blob: file.blob,
    filename: file.filename ?? `report-${job.scope}-${job.id}.${job.format}`,
    contentType: file.contentType,
  };
}

function parseFilenameFromContentDisposition(contentDisposition) {
  if (typeof contentDisposition !== "string" || contentDisposition.length === 0) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].trim();
  }

  return null;
}
