import { Alert } from "antd";
import { usePermissionGate } from "../../shared/hooks/use-permission-gate";

export function PermissionGuard({ requiredAny = [], children }) {
  const { allowed, missing } = usePermissionGate(requiredAny);

  if (allowed) return children;

  return (
    <Alert
      type="warning"
      showIcon
      message="Sem permissão para acessar esta página"
      description={
        missing.length > 0
          ? `Permissões necessárias: ${missing.join(", ")}`
          : "Seu perfil não possui acesso a este módulo."
      }
    />
  );
}
