import { createValidateBody } from "@lframework/shared";
import { createUserSchema } from "../../../application/dtos/create-user.dto";
import {
  assignUserRoleSchema,
  assignUserRolesSchema,
} from "../../../application/dtos/assign-user-role.dto";

export const validateCreateUser = createValidateBody(createUserSchema);
export const validateAssignUserRole = createValidateBody(assignUserRoleSchema);
export const validateAssignUserRoles = createValidateBody(assignUserRolesSchema);
