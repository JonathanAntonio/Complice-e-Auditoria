import type { MessagingFlowQueryDto, MessagingFlowSnapshotDto } from "../dtos/messaging-flow.dto";

export interface IMessagingFlowClient {
  getMessagingFlow(token: string, query?: MessagingFlowQueryDto): Promise<MessagingFlowSnapshotDto>;
}
