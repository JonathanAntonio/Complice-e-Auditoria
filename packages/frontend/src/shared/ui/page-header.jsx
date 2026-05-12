import { Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <Title level={3} className="page-header-title">{title}</Title>
        {subtitle ? <Paragraph type="secondary" style={{ marginBottom: 0 }}>{subtitle}</Paragraph> : null}
      </div>
      {actions ? <Space>{actions}</Space> : null}
    </div>
  );
}
