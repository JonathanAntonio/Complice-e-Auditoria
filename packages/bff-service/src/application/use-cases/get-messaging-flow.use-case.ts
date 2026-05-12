import type { MessagingFlowQueryDto, MessagingFlowSnapshotDto } from "../dtos/messaging-flow.dto";
import type { IMessagingFlowClient } from "../ports/messaging-flow-client.port";

export class GetMessagingFlowUseCase {
  constructor(private readonly client: IMessagingFlowClient) {}

  async execute(token: string, query: MessagingFlowQueryDto = {}): Promise<MessagingFlowSnapshotDto> {
    return this.client.getMessagingFlow(token, query);
  }
}
