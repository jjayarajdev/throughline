"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Briefcase, Users2, Calendar, X } from "lucide-react";

type Notification = {
  id: string;
  type: "hiring" | "partner" | "interview";
  title: string;
  message: string;
  time: string;
  image?: string;
  status?: "pending" | "approved" | "scheduled";
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const notifications: Notification[] = [
    {
      id: "1",
      type: "hiring",
      title: "New Hiring Request",
      message:
        "HRQ-2024-001 requires your approval for Software Engineer position",
      time: "2 min ago",
      status: "pending",
    },
    {
      id: "2",
      type: "partner",
      title: "Partner Onboarding",
      message: "TCS has completed the documentation process",
      time: "10 min ago",
      status: "approved",
    },
    {
      id: "3",
      type: "interview",
      title: "Interview Scheduled",
      message: "Technical round for John Doe is scheduled at 3:00 PM",
      time: "15 min ago",
      status: "scheduled",
    },
    {
      id: "4",
      type: "hiring",
      title: "Hiring Status Update",
      message: "HRQ-2024-002 has been approved by the hiring manager",
      time: "1 hour ago",
      status: "approved",
    },
    {
      id: "5",
      type: "partner",
      title: "New Partner Request",
      message: "Wipro has requested to join the partner network",
      time: "2 hours ago",
      status: "pending",
    },
  ];

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "hiring":
        return <Briefcase className="w-6 h-6 text-[#1677ff]" />;
      case "partner":
        return <Users2 className="w-6 h-6 text-blue-500" />;
      case "interview":
        return <Calendar className="w-6 h-6 text-purple-500" />;
    }
  };

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            onClick={() => setNotifying(false)}
          >
            <span
              className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
                !notifying ? "hidden" : "flex"
              }`}
            >
              <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
            </span>
            <Bell className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
          align="end"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notification
            </h5>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownMenuItem
                  className="flex items-start gap-3 rounded-lg border-b border-gray-100 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="relative flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                    {notification.status === "pending" && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-400 border-2 border-white" />
                    )}
                  </span>

                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <span>
                        {notification.type.charAt(0).toUpperCase() +
                          notification.type.slice(1)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{notification.time}</span>
                    </span>
                  </div>
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
          <Link
            href="/home/dasboard"
            className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            View All Notifications
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}