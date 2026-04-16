import { Alert, Empty, Skeleton } from "antd";

export function LoadingPanel({ rows = 4 }) {
  return <Skeleton active paragraph={{ rows }} />;
}

export function ErrorPanel({ message = "Falha de integração." }) {
  return <Alert type="warning" showIcon message="Falha" description={message} />;
}

export function EmptyPanel({ description = "Sem dados para exibir." }) {
  return <Empty description={description} />;
}
