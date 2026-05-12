import type { IIamAuthClient } from "../ports/iam-auth-client.port";
import type { LoginInputDto } from "../dtos/auth.dto";

export class LoginUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(input: LoginInputDto): Promise<string> {
    const payload = await this.iamAuthClient.login(input);
    if (typeof payload.accessToken !== "string" || payload.accessToken.length === 0) {
      throw new Error("IAM login did not return a valid access token");
    }
    return payload.accessToken;
  }
}
