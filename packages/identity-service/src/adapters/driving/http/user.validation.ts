import { createValidateBody } from "@lframework/shared";
import { createUserSchema } from "../../../application/dtos";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
  updateUserSecuritySchema,
} from "../../../application/dtos";

export const validateCreateUser = createValidateBody(createUserSchema);
export const validateAssignUserRole = createValidateBody(assignUserRoleSchema);
export const validateAssignUserRoles = createValidateBody(assignUserRolesSchema);
export const validateUpdateUserSecurity = createValidateBody(updateUserSecuritySchema);
