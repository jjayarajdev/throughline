import {
  CalendarSearch,
  UserIcon,
  Users2,
  LayoutDashboard,
  User,
  LogOut,
  Receipt,
  Settings,
  UserCheck,
  Users,
  Calendar,
  ClipboardCheck,
  UserCog,
} from "lucide-react";
import { FC } from "react";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";
export interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const MenuItem: FC<MenuItemProps> = ({ href, icon, label, onClick }) => (
  <DropdownMenuItem asChild>
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
      onClick={onClick}
    >
      {icon}
      {label}
    </Link>
  </DropdownMenuItem>
);

const dashboard = {
  href: "/home/dashboard",
  icon: <LayoutDashboard className="w-5 h-5" />,
  label: "Dashboard",
};

const partnerManagement = {
  href: "/home/partner-onboarding",
  icon: <Users2 className="w-5 h-5" />,
  label: "Partner Management",
};

const hiringManagement = {
  href: "/home/hiring-management",
  icon: <UserCog className="w-5 h-5" />,
  label: "Hiring Management",
};

// const hiringRequests = {
//   href: "/home/hiring-requests",
//   icon: <UserCog className="w-5 h-5" />,
//   label: "Hiring Management",
// };

const candidateManagement = {
  href: "/home/candidate-management",
  icon: <Users className="w-5 h-5" />,
  label: "Candidate Management",
};

const sowManagement = {
  href: "/home/partner-podetails",
  icon: <Receipt className="w-5 h-5" />,
  label: "SOW Management",
};

const candidateApproval = {
  href: "/home/candidate-approval",
  icon: <UserCheck className="w-5 h-5" />,
  label: "Exception Approvals",
};

const engagementManagement = {
  href: "/home/partner-engagement",
  icon: <UserCheck className="w-5 h-5" />,
  label: "Engagement management",
};

const interviewSlots = {
  href: "/home/slot-management",
  icon: <Calendar className="w-5 h-5" />,
  label: "Feedback Management",
};


const partnerSlotManagement = {
  href: "/home/partner-slot-management",
  icon: <CalendarSearch className="w-5 h-5" />,
  label: "Partner Slot Management",
};

const candidateOnboarding = {
  href: "/home/candidate-onboarding",
  icon: <UserCheck className="w-5 h-5" />,
  label: "Candidate Onboarding",
};

const master = {
  href: "/home/master",
  icon: <Settings className="w-5 h-5" />,
  label: "Master",
};

const hiringReview = {
  href: "/home/hiring-review-requests",
  icon: <ClipboardCheck className="w-5 h-5" />,
  label: "Hiring Review Requests",
};
export const menuItemsByRole: Record<string, MenuItemProps[]> = {
"ADMIN": [
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
  "PARTNER": [dashboard,
    candidateManagement,
    partnerSlotManagement,
    candidateOnboarding,
  ],
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
  "PANEL": [dashboard,hiringManagement, interviewSlots],
  "BET Approver": [dashboard,hiringManagement],
  "BET Member": [dashboard,hiringManagement],
  "Domain Manager": [dashboard, hiringManagement, interviewSlots],
  "Hiring Manager": [dashboard,hiringManagement, interviewSlots],
  "RM Owner": [
    dashboard,
    hiringManagement,
    candidateManagement,
    candidateApproval,
    interviewSlots,
    partnerSlotManagement,
    candidateOnboarding,
  ],
  "Onboarding SPOC": [ candidateOnboarding],
};
export const redirectBasedOnRole = (userRoles: any) => {
    const roleNames = userRoles.map((r: any) => r.name);
    if (roleNames.includes("ADMIN")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("Vendor Manager")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("Hiring Manager")) {
      window.location.href = "/home/dashboard";
    }
     else if (roleNames.includes("PARTNER")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("PANEL")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("Domain Manager")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("RM Owner")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("BET Approver")) {
      window.location.href = "/home/dashboard";
    } else if (roleNames.includes("BET Member")) {
      window.location.href = "/home/dashboard";
    }
    else if (roleNames.includes("Onboarding SPOC")) {
      window.location.href = "/home/candidate-onboarding";
    }   else {
      toast.error("You do not have access to this application.");
      return false;
    }
    return true;
  };
