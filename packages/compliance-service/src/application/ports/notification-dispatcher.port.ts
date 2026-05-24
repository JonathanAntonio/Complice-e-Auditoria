export interface ViolationNotificationInput {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  scopeOwner?: string;
  areaManager?: string;
  complianceOfficer?: string;
}

export interface INotificationDispatcher {
  dispatchViolationNotification(input: ViolationNotificationInput): Promise<void>;
}
