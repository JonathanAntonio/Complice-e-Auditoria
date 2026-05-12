import { ConfigProvider } from "antd";
import { QueryProvider } from "./query-client";
import { SessionProvider } from "../../features/auth/context/session-context";

export function AppProviders({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6366f1",
          borderRadius: 16,
          fontFamily: "'Nunito', 'Segoe UI', sans-serif",
          colorInfo: "#6366f1",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          colorError: "#f43f5e",
          wireframe: false,
        },
      }}
    >
      <QueryProvider>
        <SessionProvider>{children}</SessionProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}
