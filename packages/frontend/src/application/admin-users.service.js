import { requestBffAdmin } from "../infrastructure/http/bff-admin.api";
import {
  parseAdminCreateUserInputDto,
  parseAdminListUsersQueryDto,
  parseAdminUpdateUserRolesInputDto,
  parseAdminUpdateUserSecurityInputDto,
  parseAdminUserDto,
  parseAdminUsersListDto,
} from "./dtos/admin-user.dto";

export async function listAdminUsers(query = {}) {
  const dto = parseAdminListUsersQueryDto(query);
  const params = new URLSearchParams();
  if (dto.page) params.set("page", `${dto.page}`);
  if (dto.pageSize) params.set("pageSize", `${dto.pageSize}`);
  if (dto.search) params.set("search", dto.search);
  const suffix = params.size > 0 ? `/users?${params.toString()}` : "/users";
  const payload = await requestBffAdmin(suffix, {
    defaultErrorMessage: "Falha ao listar usuários.",
  });
  return parseAdminUsersListDto(payload);
}

export async function createAdminUser(input) {
  const dto = parseAdminCreateUserInputDto(input);
  const payload = await requestBffAdmin("/users", {
    method: "POST",
    body: dto,
    defaultErrorMessage: "Falha ao criar usuário.",
  });
  return parseAdminUserDto(payload);
}

export async function getAdminUser(userId) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("ID do usuário inválido.");
  }
  const payload = await requestBffAdmin(`/users/${encodeURIComponent(userId.trim())}`, {
    defaultErrorMessage: "Falha ao carregar usuário.",
  });
  return parseAdminUserDto(payload);
}

export async function updateAdminUserRoles(userId, input) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("ID do usuário inválido.");
  }
  const dto = parseAdminUpdateUserRolesInputDto(input);
  const payload = await requestBffAdmin(`/users/${encodeURIComponent(userId.trim())}/roles`, {
    method: "PUT",
    body: dto,
    defaultErrorMessage: "Falha ao atualizar cargos do usuário.",
  });
  return parseAdminUserDto(payload);
}

export async function updateAdminUserSecurity(userId, input) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("ID do usuário inválido.");
  }
  const dto = parseAdminUpdateUserSecurityInputDto(input);
  const payload = await requestBffAdmin(`/users/${encodeURIComponent(userId.trim())}/security`, {
    method: "PATCH",
    body: dto,
    defaultErrorMessage: "Falha ao atualizar segurança do usuário.",
  });
  return parseAdminUserDto(payload);
}

export async function deactivateAdminUser(userId) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("ID do usuário inválido.");
  }
  const payload = await requestBffAdmin(`/users/${encodeURIComponent(userId.trim())}`, {
    method: "DELETE",
    defaultErrorMessage: "Falha ao desativar usuário.",
  });
  return parseAdminUserDto(payload);
}
