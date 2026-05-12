import { randomUUID } from "crypto";

const INTEGRATION_URL = "http://localhost:4003/api/v1/integrations/events";
const COMPLIANCE_URL = "http://localhost:4002/api/v1/test/violations";
const API_KEY = "change-me-with-at-least-16-chars";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

type IntegrationResponse = {
  accepted?: boolean;
  duplicate?: boolean;
};

type ComplianceItem = {
  title?: string;
};

async function runRobustnessTests() {
  console.log(`🛡️ Iniciando Testes de Robustez (Segurança e Idempotência)...`);

  // --- TESTE 1: SEGURANÇA (API KEY) ---
  console.log("\n🔐 TESTE 1: Segurança (Acesso sem API Key)");
  try {
    const response = await fetch(INTEGRATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: randomUUID(), type: "teste.seguranca", payload: {}, correlationId: "c-1", version: "1.0", producer: "test", occurredAtUTC: new Date().toISOString() })
    });
    if (response.status === 401) {
      console.log("✅ SUCESSO: Acesso negado sem API Key (401 Unauthorized).");
    } else {
      console.error(`❌ FALHA: O sistema permitiu acesso ou retornou status inesperado: ${response.status}`);
    }
  } catch (err: unknown) {
    console.error("❌ Erro no teste de segurança:", getErrorMessage(err));
  }

  // --- TESTE 2: IDEMPOTÊNCIA (DUPLICIDADE) ---
  const duplicateEventId = randomUUID();
  const correlationId = `corr-idemp-${randomUUID()}`;
  console.log(`\n🔄 TESTE 2: Idempotência (Enviando evento ${duplicateEventId} duas vezes)`);

  try {
    const eventPayload = {
      eventId: duplicateEventId,
      type: "violation.idempotencia.teste",
      occurredAtUTC: new Date().toISOString(),
      producer: "robustness-tester",
      correlationId,
      payload: { info: "Teste de Idempotência" },
      version: "1.0",
    };

    // Primeiro envio
    console.log("  > Enviando primeira vez...");
    const res1 = await fetch(INTEGRATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(eventPayload)
    });
    const data1 = (await res1.json()) as IntegrationResponse;
    console.log(`  > Resposta 1: Accepted=${data1.accepted}, Duplicate=${data1.duplicate}`);

    // Segundo envio (imediato)
    console.log("  > Enviando segunda vez (mesmo eventId)...");
    const res2 = await fetch(INTEGRATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify(eventPayload)
    });
    const data2 = (await res2.json()) as IntegrationResponse;
    console.log(`  > Resposta 2: Accepted=${data2.accepted}, Duplicate=${data2.duplicate}`);

    if (data2.duplicate === true) {
      console.log("✅ SUCESSO: O sistema detectou a duplicidade corretamente.");
    } else {
      console.error("❌ FALHA: O sistema não marcou o segundo envio como duplicado.");
    }

    // Validar se o Compliance só criou UMA violação
    console.log("  > Aguardando processamento (5s) para validar no Compliance...");
    await sleep(5000);
    const compRes = await fetch(COMPLIANCE_URL);
    const payload: unknown = await compRes.json();
    const items = Array.isArray(payload) ? (payload as ComplianceItem[]) : [];
    const violations = items.filter((i) => typeof i.title === "string" && i.title.includes(duplicateEventId));

    if (violations.length === 1) {
      console.log(`✅ SUCESSO: Apenas 1 violação foi criada no banco de dados.`);
    } else {
      console.error(`❌ FALHA: Foram encontradas ${violations.length} violações para o mesmo evento.`);
    }

  } catch (err: unknown) {
    console.error("❌ Erro no teste de idempotência:", getErrorMessage(err));
  }

  console.log("\n🏁 Testes de Robustez Finalizados.");
}

runRobustnessTests();
