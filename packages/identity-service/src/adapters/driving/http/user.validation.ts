import { createValidateBody } from "@lframework/shared";
import { createUserSchema } from "../../../application/dtos/create-user.dto";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
} from "../../../application/dtos/assign-user-role.dto";
import { updateUserSecuritySchema } from "../../../application/dtos/update-user-security.dto";

export const validateCreateUser = createValidateBody(createUserSchema);
export const validateAssignUserRole = createValidateBody(assignUserRoleSchema);
export const validateAssignUserRoles = createValidateBody(assignUserRolesSchema);
export const validateUpdateUserSecurity = createValidateBody(updateUserSecuritySchema);
