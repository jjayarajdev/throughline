"use client";
import { ThemeToggleButton } from "@/components/common/theme-toggler";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/components/context/SidebarContext";

import React, { useState, useRef } from "react";
import HPELogo from "@/assets/HPElogo";
import Link from "next/link";
import Image from "next/image";


const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="top-0 flex w-full bg-white border-gray-200  z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-row items-center justify-between grow">
        <div className="flex items-center justify-between w-full gap-2 py-2 border-b border-gray-200 dark:border-gray-800 lg:justify-normal lg:border-b-0">

     
          <Link href="/home/dashboard" className="hidden md:block p-2">
            <Image
              className="dark:hidden"
              src="/images/hp-logo-lightmode.png"
              alt="Logo"
              width={120}
              height={35}
              priority
            />
            <Image
              className="hidden dark:block"
              src="/images/hp-logo-darkmode.png"
              alt="Logo"
              width={120}
              height={35}
            />
          </Link>

          {/* Right-side Navigation */}
          <div className="flex items-center justify-end w-full gap-4 px-5 py-4">
            <div className="flex items-center gap-3 2xsm:gap-3">
              <ThemeToggleButton />
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;