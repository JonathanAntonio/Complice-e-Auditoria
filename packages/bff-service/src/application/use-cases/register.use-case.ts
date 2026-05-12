import type { IIamAuthClient } from "../ports/iam-auth-client.port";
import type { RegisterInputDto } from "../dtos/auth.dto";

export class RegisterUseCase {
  constructor(private readonly iamAuthClient: IIamAuthClient) {}

  async execute(input: RegisterInputDto): Promise<string> {
    const payload = await this.iamAuthClient.register(input);
    if (typeof payload.accessToken !== "string" || payload.accessToken.length === 0) {
      throw new Error("IAM register did not return a valid access token");
    }
    return payload.accessToken;
  }
}
