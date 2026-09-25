import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { toast } from "@/lib/toast";

export interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const dashboard: MenuItemProps = { href: "/home/dashboard", icon: <AppstoreOutlined />, label: "Dashboard" };
const partnerManagement: MenuItemProps = { href: "/home/partner-onboarding", icon: <TeamOutlined />, label: "Partner Management" };
const hiringManagement: MenuItemProps = { href: "/home/hiring-management", icon: <SolutionOutlined />, label: "Hiring Management" };
const candidateManagement: MenuItemProps = { href: "/home/candidate-management", icon: <UsergroupAddOutlined />, label: "Candidate Management" };
const sowManagement: MenuItemProps = { href: "/home/partner-podetails", icon: <FileDoneOutlined />, label: "SOW Management" };
const candidateApproval: MenuItemProps = { href: "/home/candidate-approval", icon: <AuditOutlined />, label: "Exception Approvals" };
const engagementManagement: MenuItemProps = { href: "/home/partner-engagement", icon: <UserSwitchOutlined />, label: "Engagement management" };
const interviewSlots: MenuItemProps = { href: "/home/slot-management", icon: <CalendarOutlined />, label: "Feedback Management" };
const partnerSlotManagement: MenuItemProps = { href: "/home/partner-slot-management", icon: <ScheduleOutlined />, label: "Partner Slot Management" };
const candidateOnboarding: MenuItemProps = { href: "/home/candidate-onboarding", icon: <UserAddOutlined />, label: "Candidate Onboarding" };
const master: MenuItemProps = { href: "/home/master", icon: <SettingOutlined />, label: "Master" };

export const menuItemsByRole: Record<string, MenuItemProps[]> = {
  ADMIN: [
    dashboard,
    partnerManagement,
    hiringManagement,
    candidateManagement,
    sowManagement,
    candidateApproval,
    engagementManagement,
    interviewSlots,
    partnerSlotManagement,
    candidateOnboarding,
    master,
  ],
  PARTNER: [dashboard, candidateManagement, partnerSlotManagement, candidateOnboarding],
  "Vendor Manager": [
    dashboard,
    partnerManagement,
    hiringManagement,
    candidateManagement,
    sowManagement,
    candidateApproval,
    engagementManagement,
    interviewSlots,
    candidateOnboarding,
  ],
  PANEL: [dashboard, hiringManagement, interviewSlots],
  "BET Approver": [dashboard, hiringManagement],
  "BET Member": [dashboard, hiringManagement],
  "Domain Manager": [dashboard, hiringManagement, interviewSlots],
  "Hiring Manager": [dashboard, hiringManagement, interviewSlots],
  "RM Owner": [dashboard, hiringManagement, candidateManagement, candidateApproval, interviewSlots, partnerSlotManagement, candidateOnboarding],
  "Onboarding SPOC": [candidateOnboarding],
};

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/home/dashboard",
  "Vendor Manager": "/home/dashboard",
  "Hiring Manager": "/home/dashboard",
  PARTNER: "/home/dashboard",
  PANEL: "/home/dashboard",
  "Domain Manager": "/home/dashboard",
  "RM Owner": "/home/dashboard",
  "BET Approver": "/home/dashboard",
  "BET Member": "/home/dashboard",
  "Onboarding SPOC": "/home/candidate-onboarding",
};

/** Send the user to the first landing page their roles allow; false when they have none. */
export const redirectBasedOnRole = (userRoles: { name: string }[]) => {
  const roleNames = userRoles.map((r) => r.name);
  const target = Object.keys(HOME_BY_ROLE).find((role) => roleNames.includes(role));
  if (!target) {
    toast.error("You do not have access to this application.");
    return false;
  }
  window.location.href = HOME_BY_ROLE[target];
  return true;
};
