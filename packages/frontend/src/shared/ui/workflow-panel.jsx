import { Card, Space, Typography } from "antd";

const { Paragraph, Text, Title } = Typography;

export function WorkflowPanel({ title, description, steps = [], extra }) {
  return (
    <Card className="workflow-panel" extra={extra}>
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Title level={5} style={{ margin: 0 }}>{title}</Title>
        {description ? <Paragraph type="secondary" style={{ marginBottom: 2 }}>{description}</Paragraph> : null}
        <div className="workflow-steps">
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className="workflow-step">
              <span className="workflow-step-index">{index + 1}</span>
              <Text>{step}</Text>
            </div>
          ))}
        </div>
      </Space>
    </Card>
  );
}
