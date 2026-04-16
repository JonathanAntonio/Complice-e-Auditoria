import { z } from "zod";
import { userResponseDtoSchema } from "./user-response.dto";

export const userListResponseDtoSchema = z.object({
  items: z.array(userResponseDtoSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type UserListResponseDto = z.infer<typeof userListResponseDtoSchema>;
