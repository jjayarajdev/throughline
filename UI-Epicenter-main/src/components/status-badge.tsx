"use client";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  PauseCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  StarOutlined,
  SyncOutlined,
} from "@ant-design/icons";

interface StatusBadgeProps {
  status: string;
  /** explicit Ant preset colour (green / gold / orange / red / purple / blue / default) */
  color?: string;
  showIcon?: boolean;
}

const COLOR: Record<string, string> = {
  active: "green",
  selected: "green",
  "open-wip": "green",
  "candidate identified": "green",
  "offer accepted": "green",
  "offer rolled out": "green",
  onboarded: "green",
  joined: "green",
  approved: "green",
  pending: "gold",
  "in progress": "gold",
  screening: "gold",
  "under evaluation": "gold",
  interviewing: "gold",
  "feedback pending": "gold",
  "on hold": "orange",
  onhold: "orange",
  rejected: "red",
  cancelled: "red",
  "offer declined": "red",
  "candidate dropped": "red",
  declined: "red",
  inactive: "default",
  closed: "default",
  new: "blue",
};

const ICON: Record<string, React.ReactNode> = {
  green: <CheckCircleOutlined />,
  gold: <ClockCircleOutlined />,
  orange: <PauseCircleOutlined />,
  red: <CloseCircleOutlined />,
  blue: <StarOutlined />,
  purple: <SyncOutlined />,
  default: <MinusCircleOutlined />,
};

/** Map legacy colour names used by helpers (yellow, gray…) to Ant presets. */
const LEGACY: Record<string, string> = { yellow: "gold", gray: "default", grey: "default" };

/** Status pill on Ant Design's Tag. Colour is derived from the status text unless `color` is given. */
export function StatusBadge({ status, color, showIcon = true }: StatusBadgeProps) {
  if (!status) return null;
  const key = status.toLowerCase();
  const preset = LEGACY[color ?? ""] ?? color ?? COLOR[key] ?? "default";
  const icon = key === "screening" ? <SearchOutlined /> : ICON[preset] ?? <QuestionCircleOutlined />;
  return (
    <Tag color={preset} icon={showIcon ? icon : undefined} style={{ marginInlineEnd: 0 }}>
      {status}
    </Tag>
  );
}

export default StatusBadge;
