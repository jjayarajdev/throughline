"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxIcon,
  CalendarClock,
  ChevronDown,
  GridIcon,
  Handshake,
  PieChart,
  Plug,
  RectangleHorizontal,
  SquareUserRound,
  Users,
} from "lucide-react";
import {MenuItemProps ,menuItemsByRole } from "./UserRoles";
import { useUserStore } from "@/store/userStore";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/home/dashboard",
  },
  {
    icon: <Handshake />,
    name: "Partner Management",
    path: "/home/partner-onboarding",
  },
  {
    icon: <Users />,
    name: "Hiring Management",
    path: "/home/hiring-management",
  },
  {
    icon: <SquareUserRound />,
    name: "Candidate Management",
    path: "/home/candidate-management",
  },
  {
    icon: <CalendarClock />,
    name: "Slot Management",
    path: "/home/slot-management",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChart />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <Plug />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { userName, email, roles } = useUserStore();
  
  const getMenuItems = () => {
    if (!roles?.length) return [];

    const menuItems = roles.reduce((items: MenuItemProps[], role) => {
      const roleMenuItems = menuItemsByRole[role.name] || [];
      return [...items, ...roleMenuItems];
    }, []);
    return Array.from(
      new Map(menuItems.map((item) => [item.href, item])).values()
    );
  };

  const userMenuItems = getMenuItems();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {userMenuItems.map((nav, index) => (
        <li key={index}>
          {nav?.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out group relative overflow-hidden
                ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "bg-[#01A982] text-[#FFFFFF] shadow-lg shadow-[#01A982]/20"
                    : "text-[#FFFFFF]/80 hover:bg-[#05CC93]/20 hover:text-[#FFFFFF]"
                } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center lg:px-3"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-[#FFFFFF] scale-110"
                    : "text-[#FFFFFF]/80 group-hover:text-[#FFFFFF] group-hover:scale-110"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="ml-3 text-sm font-medium truncate">{nav.label}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={`ml-auto w-4 h-4 transition-all duration-300 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-[#FFFFFF]"
                      : "text-[#FFFFFF]/60 group-hover:text-[#FFFFFF]"
                  }`}
                />
              )}
              {/* Active state indicator */}
              {openSubmenu?.type === menuType && openSubmenu?.index === index && (
                <div className="absolute left-0 top-0 w-1 h-full bg-[#00E0AF] rounded-r-full"></div>
              )}
            </button>
          ) : (
            nav.href && (
              <Link
                href={nav.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out group relative overflow-hidden
                  ${
                    isActive(nav.href)
                      ? "bg-[#01A982] text-[#FFFFFF] shadow-lg shadow-[#01A982]/20"
                      : "text-[#FFFFFF]/80 hover:bg-[#05CC93]/20 hover:text-[#FFFFFF]"
                  } ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center lg:px-3"
                      : "lg:justify-start"
                  }`}
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                    isActive(nav.href)
                      ? "text-[#FFFFFF] scale-110"
                      : "text-[#FFFFFF]/80 group-hover:text-[#FFFFFF] group-hover:scale-110"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="ml-3 text-sm font-medium truncate">{nav.label}</span>
                )}
                {/* Active state indicator */}
                {isActive(nav.href) && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#00E0AF] rounded-r-full"></div>
                )}
              </Link>
            )
          )}
          {nav?.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-8 pl-4 border-l border-[#FFFFFF]/10">
                {nav?.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-300 group relative
                        ${
                          isActive(subItem.path)
                            ? "bg-[#01A982]/20 text-[#01A982] font-medium"
                            : "text-[#FFFFFF]/60 hover:bg-[#62E5F6]/10 hover:text-[#62E5F6]"
                        }`}
                    >
                      <span className="truncate">{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-2">
                        {subItem.new && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#00E0AF] text-[#000000]">
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#7764FC] text-[#FFFFFF]">
                            pro
                          </span>
                        )}
                      </span>
                      {/* Active submenu indicator */}
                      {isActive(subItem.path) && (
                        <div className="absolute left-0 top-1/2 w-2 h-2 bg-[#01A982] rounded-full -translate-y-1/2 -translate-x-1"></div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-[#292D3A] z-99 h-screen transition-all duration-300 ease-in-out border-r border-[#FFFFFF]/10 shadow-2xl
        ${
          isExpanded || isMobileOpen
            ? "w-[25%] max-w-[280px] min-w-[240px]"
            : isHovered
            ? "w-[20%] max-w-[220px] min-w-[180px]"
            : "w-[8%] max-w-[65px] min-w-[60px]"  
         }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`py-6 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <div className="transition-all duration-300">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#01A982] to-[#05CC93] rounded-xl flex items-center justify-center shadow-lg">
                <RectangleHorizontal className="w-6 h-6 text-[#FFFFFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
                  Epicenter
                </h1>
                <p className="text-xs text-[#FFFFFF]/60 font-medium">
                  HPE
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-[#01A982] to-[#05CC93] rounded-xl flex items-center justify-center shadow-lg">
              <RectangleHorizontal className="w-6 h-6 text-[#FFFFFF]" />
            </div>
          )}
          </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#FFFFFF]/20 to-transparent mb-6"></div>

      {/* Navigation Section */}
      <div className="flex flex-col overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#FFFFFF]/10 scrollbar-track-transparent">
        <nav className="flex-1">
          <div className="flex flex-col gap-8">
            <div>
              <h2
                className={`mb-4 text-xs uppercase font-bold tracking-wider flex leading-[20px] text-[#FFFFFF]/40 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  <span className="px-1">Main Menu</span>
                ) : (
                  <span className="w-6 h-0.5 bg-[#01A982] rounded-full"></span>
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Uncomment if needed
            <div>
              <h2
                className={`mb-4 text-xs uppercase font-bold tracking-wider flex leading-[20px] text-[#FFFFFF]/40 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  <span className="px-1">Others</span>
                ) : (
                  <span className="w-6 h-0.5 bg-[#01A982] rounded-full"></span>
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
            */}
          </div>
        </nav>

        {/* User Profile Section */}
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-auto pt-6 border-t border-[#FFFFFF]/10">
            <div className="px-3 py-3 rounded-xl bg-[#000000]/20 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#62E5F6] to-[#0070F8] rounded-full flex items-center justify-center text-[#FFFFFF] text-sm font-bold shadow-lg">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FFFFFF] truncate">
                    {userName || "User"}
                  </p>
                  <p className="text-xs text-[#FFFFFF]/60 truncate">
                    {email || "user@example.com"}
                  </p>
                </div>
                <div className="w-2 h-2 bg-[#00E0AF] rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
