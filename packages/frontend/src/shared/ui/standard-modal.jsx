import { Modal, Space, Typography } from "antd";

const { Paragraph, Title } = Typography;

export function StandardModal({ title, description, children, ...props }) {
  return (
    <Modal
      className="standard-modal"
      width={700}
      destroyOnHidden
      {...props}
      title={(
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>{title}</Title>
          {description ? <Paragraph type="secondary" style={{ marginBottom: 0 }}>{description}</Paragraph> : null}
        </Space>
      )}
    >
      {children}
    </Modal>
  );
}
