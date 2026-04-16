import { Tag } from "antd";

export function SeverityTag({ value }) {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (normalized === "alta" || normalized === "high" || normalized === "critical") return <Tag color="red">Alta</Tag>;
  if (normalized === "media" || normalized === "medium") return <Tag color="gold">Média</Tag>;
  return <Tag color="green">Baixa</Tag>;
}

export function BoolTag({ value, trueLabel = "Sim", falseLabel = "Não" }) {
  return value ? <Tag color="green">{trueLabel}</Tag> : <Tag color="default">{falseLabel}</Tag>;
}

export function RetentionStatusTag({ value }) {
  if (value === "success") return <Tag color="green">Sucesso</Tag>;
  if (value === "failed") return <Tag color="red">Falha</Tag>;
  return <Tag color="blue">Executando</Tag>;
}

export function NotificationStatusTag({ value }) {
  if (value === "sent") return <Tag color="green">Enviado</Tag>;
  if (value === "dead_letter") return <Tag color="red">Dead-letter</Tag>;
  return <Tag color="gold">Falha</Tag>;
}
