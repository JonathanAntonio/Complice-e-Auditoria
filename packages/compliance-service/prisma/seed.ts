import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const VIOLATIONS = [
  // SLA estourado - alta (>3d)
  { name: "Acesso privilegiado sem aprovação detectado",       severity: "alta",  status: "aberta",    daysAgo: 10 },
  { name: "Transferência acima do limite sem justificativa",   severity: "alta",  status: "aberta",    daysAgo: 8  },
  { name: "Alteração de contrato sem dupla aprovação",         severity: "alta",  status: "em_analise",daysAgo: 5  },
  { name: "Log de acesso ausente por 2 horas",                 severity: "alta",  status: "aberta",    daysAgo: 4  },
  // SLA estourado - media (>7d)
  { name: "Relatório mensal enviado fora do prazo",            severity: "media", status: "aberta",    daysAgo: 14 },
  { name: "Política de senhas desatualizada",                  severity: "media", status: "em_analise",daysAgo: 9  },
  { name: "Fornecedor sem contrato vigente ativo",             severity: "media", status: "aberta",    daysAgo: 8  },
  // Em prazo - alta
  { name: "Tentativa de acesso a recurso restrito",            severity: "alta",  status: "em_analise",daysAgo: 1  },
  { name: "Exportação de dados sensíveis sem log",             severity: "alta",  status: "aberta",    daysAgo: 2  },
  // Em prazo - media
  { name: "Usuário inativo com acesso ativo há 90 dias",       severity: "media", status: "aberta",    daysAgo: 5  },
  { name: "Chave de API exposta em repositório interno",       severity: "media", status: "em_analise",daysAgo: 3  },
  { name: "Backup sem verificação de integridade",             severity: "media", status: "aberta",    daysAgo: 6  },
  // Em prazo - baixa
  { name: "Documento de política sem revisão anual",           severity: "baixa", status: "aberta",    daysAgo: 10 },
  { name: "Treinamento de compliance pendente para 3 usuários",severity: "baixa", status: "aberta",    daysAgo: 8  },
  { name: "Auditoria trimestral atrasada em 2 semanas",        severity: "baixa", status: "em_analise",daysAgo: 5  },
  // Resolvidas
  { name: "Permissão excessiva removida com sucesso",          severity: "alta",  status: "resolvida", daysAgo: 20 },
  { name: "Incidente de phishing tratado e encerrado",         severity: "alta",  status: "resolvida", daysAgo: 15 },
  { name: "MFA habilitado para todos os usuários admin",       severity: "media", status: "resolvida", daysAgo: 12 },
  { name: "Revisão de acessos trimestrais concluída",          severity: "baixa", status: "resolvida", daysAgo: 7  },
  { name: "Certificado SSL renovado antes do vencimento",      severity: "baixa", status: "resolvida", daysAgo: 3  },
  // Dispensadas
  { name: "Alerta de anomalia confirmado como falso positivo", severity: "baixa", status: "dispensada",daysAgo: 18 },
  { name: "Desvio de processo aprovado por exceção formal",    severity: "media", status: "dispensada",daysAgo: 11 },
  { name: "Teste de penetração autorizado — gerou alerta",     severity: "alta",  status: "dispensada",daysAgo: 6  },
];

async function main() {
  console.log("🌱 Seeding compliance-service...");

  for (const v of VIOLATIONS) {
    await prisma.itemModel.create({
      data: {
        name: v.name,
        priceAmount: 0,
        priceCurrency: "BRL",
        status: v.status as "aberta" | "em_analise" | "resolvida" | "dispensada",
        createdAt: daysAgo(v.daysAgo),
        resolvedAt: v.status === "resolvida" ? new Date() : null,
        dismissedAt: v.status === "dispensada" ? new Date() : null,
      },
    });
  }

  console.log(`  ✓ ${VIOLATIONS.length} violations`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
