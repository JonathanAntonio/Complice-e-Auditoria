import { randomUUID } from "crypto";

/**
 * Script de Teste E2E: Fluxo de Evento -> Auditoria -> Compliance
 * 
 * Requisitos:
 * 1. Docker infra subindo (Postgres, RabbitMQ, Redis)
 * 2. Serviços Integration, Audit e Compliance rodando
 * 3. .env configurado com as portas corretas
 */

const INTEGRATION_URL = "http://localhost:4003/api/v1/integrations/events";
const COMPLIANCE_URL = "http://localhost:4002/api/v1/test/violations";
const API_KEY = "change-me-with-at-least-16-chars"; // Deve bater com INTEGRATION_API_KEY no .env

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  const correlationId = `test-corr-${randomUUID()}`;
  const eventId = randomUUID();

  console.log(`🚀 Iniciando Teste E2E...`);
  console.log(`🔗 Correlation ID: ${correlationId}`);

  // 1. Enviar evento suspeito para o Integration Service
  console.log("\n1️⃣ Enviando evento suspeito para o Integration Service...");
  try {
    const response = await fetch(INTEGRATION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": API_KEY, 
        "x-correlation-id": correlationId 
      },
      body: JSON.stringify({
        eventId,
        type: "transacao.suspeita.teste",
        occurredAtUTC: new Date().toISOString(),
        producer: "e2e-tester",
        correlationId,
        payload: { valor: 99999, motivo: "Teste de Fluxo" },
        version: "1.0",
      }),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Integration error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ Evento aceito pelo Integration:", data);
  } catch (err: any) {
    console.error("❌ Falha ao enviar evento:", err.message);
    process.exit(1);
  }

  // 2. Aguardar processamento assíncrono (RabbitMQ)
  console.log("\n⏳ Aguardando processamento assíncrono (5s)...");
  await sleep(5000);

  // 3. Verificar se o Compliance Service criou a violação
  console.log("\n2️⃣ Verificando detecção de violação no Compliance Service...");
  try {
    const response = await fetch(COMPLIANCE_URL);
    if (!response.ok) {
        throw new Error(`Compliance fetch failed (${response.status}): ${await response.text()}`);
    }
    
    const items: any = await response.json();
    const violation = items.find((i: any) => i.title && i.title.includes("transacao.suspeita.teste"));

    if (violation) {
      console.log("✅ VIOLAÇÃO DETECTADA COM SUCESSO!");
      console.log("🆔 ID da Violação:", violation.id);
      console.log("📝 Título:", violation.title);
      console.log("📊 Status:", violation.status);
    } else {
      console.error("❌ Violação não encontrada no Compliance Service.");
      console.log("Itens atuais:", items.map((i: any) => i.title));
    }
  } catch (err: any) {
    console.error("❌ Erro ao consultar Compliance Service:", err.message);
  }

  console.log("\n🏁 Teste E2E Finalizado.");
}

runTest();
