import { ConfigProvider } from "antd";
import { QueryProvider } from "./query-client";
import { SessionProvider } from "../../features/auth/context/session-context";

export function AppProviders({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f3b66",
          borderRadius: 10,
          fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
        },
      }}
    >
      <QueryProvider>
        <SessionProvider>{children}</SessionProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}
