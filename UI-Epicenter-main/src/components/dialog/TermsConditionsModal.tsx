"use client";
import { Modal, Typography } from "antd";

interface TermsConditionsModalProps {
  open: boolean;
  onCancel: () => void;
  onAccept: () => void;
  confirmLoading?: boolean;
}

/** The candidate-intake terms and conditions; Accept resolves the form's agreement checkbox. */
export function TermsConditionsModal({ open, onCancel, onAccept, confirmLoading }: TermsConditionsModalProps) {
  return (
    <Modal open={open} onCancel={onCancel} onOk={onAccept} confirmLoading={confirmLoading} okText="Accept" cancelText="Cancel" title="Terms and Conditions" destroyOnHidden>
      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        <Typography>
          <Typography.Title level={5}>1. Introduction</Typography.Title>
          <Typography.Paragraph>
            These Terms and Conditions govern your use of our candidate intake system. By using this system, you agree to these terms in full.
          </Typography.Paragraph>
          <Typography.Title level={5}>2. Data Privacy</Typography.Title>
          <Typography.Paragraph>
            We are committed to protecting candidate data and comply with all relevant data protection laws. All information submitted will be handled
            confidentially.
          </Typography.Paragraph>
          <Typography.Title level={5}>3. Responsibilities</Typography.Title>
          <Typography.Paragraph>You agree to:</Typography.Paragraph>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of candidate data</li>
            <li>Use the system only for its intended purpose</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
          <Typography.Title level={5}>4. Usage Guidelines</Typography.Title>
          <Typography.Paragraph>
            The system must be used in accordance with our usage guidelines, which prohibit any unauthorized or malicious activities.
          </Typography.Paragraph>
        </Typography>
      </div>
    </Modal>
  );
}

export default TermsConditionsModal;
