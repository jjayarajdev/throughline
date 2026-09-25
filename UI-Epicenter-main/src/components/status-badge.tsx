"use client";

import {
  CheckCircle,
  Clock,
  Hammer,
  Handshake,
  HelpCircle,
  Mic,
  Moon,
  PauseCircle,
  Search,
  Send,
  Slash,
  Sparkle,
  Sparkles,
  XCircle,
} from "lucide-react";
interface StatusBadgeProps {
  status: string;
  color?: string;
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
  if (!status) return null;
  const getStatusStyles = (status: StatusBadgeProps["status"]) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "selected":
      case "open-wip":
      case "candidate identified":
      case "offer accepted":
      case "offer rolled out":
      case "onboarded":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30";
      case "pending":
      case "in progress":
      case "screening":
      case "under evaluation":
      case "interviewing":
      case "feedback pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "on hold":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "rejected":
      case "cancelled":
      case "offer declined":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30";
      case "inactive":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30";
      case "new":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30";

      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30";
    }
  };
  const getStatusIcon = (status: StatusBadgeProps["status"]) => {
    if (!status) return <HelpCircle className="h-3.5 w-3.5 mr-1.5" />;
    switch (status.toLowerCase()) {
      case "active":
      case "selected":
        return <CheckCircle className="h-3.5 w-3.5 mr-1.5" />;
      case "pending":
      case "under evaluation":
      case "in progress":
      case "screening":
      case "feedback pending":
        return <Clock className="h-3.5 w-3.5 mr-1.5" />;
      case "on hold":
        return <PauseCircle className="h-3.5 w-3.5 mr-1.5" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5 mr-1.5" />;
      case "inactive":
        return <Moon className="h-3.5 w-3.5 mr-1.5" />;
      case "offer accepted":
      case "onboarded":
        return <Handshake className="h-3.5 w-3.5 mr-1.5" />;
      case "interviewing":
        return <Mic className="h-3.5 w-3.5 mr-1.5" />;
      case "offer rolled out":
        return <Send className="h-3.5 w-3.5 mr-1.5" />;
      case "candidate identified":
        return <Search className="h-3.5 w-3.5 mr-1.5" />;
      case "open-wip":
        return <Hammer className="h-3.5 w-3.5 mr-1.5" />;
      case "new":
        return <Sparkles className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return <XCircle className="h-3.5 w-3.5 mr-1.5" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-${color}-500 ${getStatusStyles(
        status
      )}`}
    >
  
      {/* <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span> */}
      {getStatusIcon(status)}
      {status || "N/A"}
    </span>
  );
}
