"use client";
import { useLogout } from "@/lib/useLogout";
import { useUserStore } from "@/store/userStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  UserIcon,
  User,
  LogOut,
} from "lucide-react";
import { MenuItem } from "../layout/UserRoles";




export default function UserDropdown() {
  const { userName, email, roles, partnerName, partnerId } = useUserStore();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center text-gray-700 dark:text-gray-400">
          <span className="block mr-1 font-medium text-theme-sm">
            {userName}
          </span>
          <span className=" overflow-hidden rounded-full h-11 w-11">
            <UserIcon className="h-9 w-9 text-gray-400 rounded-full bg-gray-100 p-1" />
          </span>
          {/* <Menu
            className="stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200"
            size={18}
          /> */}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[260px] rounded-2xl bg-white p-3 shadow-lg dark:bg-gray-dark"
      >
        {/* User Info */}
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userName}{" "}
            <span className="block font-light text-gray-700 text-theme-sm dark:text-gray-400">
              {roles.length > 0
                ? ` (${roles.map((role) => role.name).join(", ")})`
                : ""}
            </span>
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
          {partnerName && (
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
              {partnerName}
            </span>
          )}
        </div>

        <DropdownMenuSeparator className="my-2" />

        {/* Menu Items */}
        {/* <DropdownMenuGroup>
          {userMenuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </DropdownMenuGroup> */}
        {partnerId && (
          <MenuItem
            href={`/home/edit-profile?id=${partnerId}&tab=profile`}
            icon={<User className="w-5 h-5" />}
            label="Edit profile"
          />
        )}

        <DropdownMenuItem asChild>
          <div
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
