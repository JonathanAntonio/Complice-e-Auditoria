import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInputDto = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export type RegisterInputDto = z.infer<typeof registerInputSchema>;

export function parseLoginInputDto(data: unknown): LoginInputDto | null {
  const result = loginInputSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parseRegisterInputDto(data: unknown): RegisterInputDto | null {
  const result = registerInputSchema.safeParse(data);
  return result.success ? result.data : null;
}

export interface AuthResponseDto {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    primaryRole: string;
    roles: string[];
    permissions: string[];
  };
}
