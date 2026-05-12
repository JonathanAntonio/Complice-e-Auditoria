export function parseMessagingFlowSnapshotDto(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida do fluxo de mensageria.");
  }
  const payload = raw;
  if (!Array.isArray(payload.flowNodes) || !payload.summary || typeof payload.summary !== "object") {
    throw new Error("Resposta inválida do fluxo de mensageria.");
  }
  if (!Array.isArray(payload.consumers) || !Array.isArray(payload.recentAuditEvents) || !Array.isArray(payload.recentFailures)) {
    throw new Error("Resposta inválida do fluxo de mensageria.");
  }
  return payload;
}
