"use client";
import * as React from "react";
import { Avatar as AntAvatar } from "antd";
import { cn } from "@/lib/utils";
import { findChild } from "./_internal";

function AvatarImage(_props: React.ComponentProps<"img">) {
  return null; // read by <Avatar>
}
function AvatarFallback(_props: React.ComponentProps<"span"> & { delayMs?: number }) {
  return null; // read by <Avatar>
}

/** Avatar on Ant Design; `AvatarImage` supplies `src`, `AvatarFallback` supplies the fallback content. */
function Avatar({ className, children, ...props }: React.ComponentProps<"span">) {
  const image = findChild<React.ComponentProps<"img">>(children, AvatarImage);
  const fallback = findChild<React.ComponentProps<"span">>(children, AvatarFallback);
  return (
    <AntAvatar
      data-slot="avatar"
      src={image?.props.src}
      alt={image?.props.alt}
      className={cn("shrink-0 select-none", fallback?.props.className, className)}
      {...(props as any)}
    >
      {fallback?.props.children}
    </AntAvatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
