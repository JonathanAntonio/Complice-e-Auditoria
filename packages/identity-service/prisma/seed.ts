import { PrismaClient } from "../generated/prisma-client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: "compliance.violations.read",   name: "Ler violações",             module: "compliance" },
  { code: "compliance.violations.create", name: "Criar violações",           module: "compliance" },
  { code: "audit.logs.read.any",          name: "Ler todos os logs",         module: "audit" },
  { code: "audit.logs.read.scoped",       name: "Ler logs do próprio escopo",module: "audit" },
  { code: "risk.scores.read",             name: "Ler scores de risco",       module: "risk" },
  { code: "reports.read",                 name: "Ler relatórios",            module: "reporting" },
  { code: "reports.export",               name: "Exportar relatórios",       module: "reporting" },
  { code: "system.settings.manage",       name: "Gerenciar configurações",   module: "system" },
  { code: "users.read.any",               name: "Ler usuários",              module: "admin" },
  { code: "users.create",                 name: "Criar usuários",            module: "admin" },
  { code: "users.update",                 name: "Atualizar usuários",        module: "admin" },
  { code: "users.deactivate",             name: "Desativar usuários",        module: "admin" },
  { code: "roles.assign",                 name: "Atribuir roles",            module: "admin" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "role-administrador": PERMISSIONS.map((p) => p.code),
  "role-compliance-officer": [
    "compliance.violations.read",
    "compliance.violations.create",
    "audit.logs.read.scoped",
    "reports.read",
    "reports.export",
    "risk.scores.read",
  ],
  "role-auditor-interno": [
    "audit.logs.read.any",
    "audit.logs.read.scoped",
    "reports.read",
    "reports.export",
    "risk.scores.read",
    "compliance.violations.read",
  ],
  "role-auditor-externo": [
    "audit.logs.read.scoped",
    "reports.read",
    "compliance.violations.read",
  ],
  "role-gestor": [
    "compliance.violations.read",
    "risk.scores.read",
    "reports.read",
    "reports.export",
    "audit.logs.read.scoped",
  ],
  "role-visualizador": [
    "reports.read",
  ],
};

const USERS = [
  { email: "admin@demo.com",      name: "Admin Demo",         roleId: "role-administrador" },
  { email: "compliance@demo.com", name: "Ana Compliance",     roleId: "role-compliance-officer" },
  { email: "auditor@demo.com",    name: "Bruno Auditor",      roleId: "role-auditor-interno" },
  { email: "gestor@demo.com",     name: "Carlos Gestor",      roleId: "role-gestor" },
  { email: "viewer@demo.com",     name: "Diana Visualizadora", roleId: "role-visualizador" },
];

const PASSWORD = "Senha@123!";

async function main() {
  console.log("🌱 Seeding identity-service...");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Upsert permissions
  for (const perm of PERMISSIONS) {
    await prisma.permissionModel.upsert({
      where: { code: perm.code },
      create: { id: `perm-${perm.code.replace(/\./g, "-")}`, code: perm.code, name: perm.name, module: perm.module },
      update: { name: perm.name, module: perm.module },
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions`);

  // Assign permissions to roles
  for (const [roleId, codes] of Object.entries(ROLE_PERMISSIONS)) {
    for (const code of codes) {
      const permission = await prisma.permissionModel.findUnique({ where: { code } });
      if (!permission) continue;
      await prisma.rolePermissionModel.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        create: { roleId, permissionId: permission.id },
        update: {},
      });
    }
  }
  console.log("  ✓ role permissions assigned");

  // Upsert users — bump authorizationVersion so any existing JWT is invalidated
  for (const u of USERS) {
    const existing = await prisma.userModel.findUnique({ where: { email: u.email } });
    const user = await prisma.userModel.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        isActive: true,
        createdAt: new Date(),
        authorizationVersion: 1,
      },
      update: {
        name: u.name,
        isActive: true,
        // Increment only for already-existing users so stale JWTs are rejected
        authorizationVersion: existing ? { increment: 1 } : undefined,
      },
    });

    await prisma.userRoleModel.upsert({
      where: { userId_roleId: { userId: user.id, roleId: u.roleId } },
      create: { userId: user.id, roleId: u.roleId, isPrimary: true, assignedBy: "seed" },
      update: {},
    });
  }
  console.log(`  ✓ ${USERS.length} users (authorizationVersion bumped for existing sessions)`);
  console.log("  📧 Credenciais: <email> / Senha@123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
