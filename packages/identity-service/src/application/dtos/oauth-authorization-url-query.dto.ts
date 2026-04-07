import { z } from "zod";

const OAUTH_REDIRECT_URI_MAX_LENGTH = 2048;

export const oauthAuthorizationUrlQuerySchema = z.object({
  redirect_uri: z.string().url("redirect_uri must be a valid URL")
    .max(OAUTH_REDIRECT_URI_MAX_LENGTH, "redirect_uri too long")
    .optional(),
});

export type OAuthAuthorizationUrlQueryDto = z.infer<typeof oauthAuthorizationUrlQuerySchema>;
