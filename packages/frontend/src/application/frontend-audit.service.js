import { requestBffAudit } from "../infrastructure/http/bff-audit.api";

/**
 * Envia um evento de auditoria gerado no frontend para o BFF.
 * O BFF enriquecerá com o userId e correlationId antes de enviar ao Audit Service.
 * @param {string} type Tipo do evento (ex: frontend.error, frontend.security)
 * @param {Object} payload Dados do evento
 * @param {string} severity 'low', 'medium', 'high', 'critical'
 */
export async function sendFrontendAuditEvent(type, payload, severity = "low") {
  const envelope = {
    type,
    producer: "frontend-app",
    severity,
    payload: {
      ...payload,
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
  };

  try {
    await requestBffAudit("/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });
  } catch (err) {
    console.error("[Frontend Audit] Falha ao enviar log de auditoria", err);
  }
}
