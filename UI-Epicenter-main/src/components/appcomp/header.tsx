"use client";

import { Bell, Settings, User2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
export function Header() {
  return (
    <header className="bg-[#00b388] h-16 flex items-center justify-between px-8 ">
      <div className="flex items-center gap-2 text-white">
          <Image
            src="/images/hp-logo.png"
            alt="hp logo"
            width={100}
            height={70}
          />
          <Separator orientation="vertical" className="bg-white h-full w-2.5" />
          <span className="text-2xl font-semibold">EpiCenter</span>
      </div>

      <div className="flex items-center gap-4 text-white">
        <button className="hover:opacity-80">
          <Bell className="w-5 h-5" />
        </button>
        <button className="hover:opacity-80">
          <Settings className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Devanjan</span>
        </div>
      </div>
    </header>
  );
}
