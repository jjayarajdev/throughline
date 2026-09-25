"use client";
import * as React from "react";
import { Alert as AntAlert } from "antd";
import { cn } from "@/lib/utils";
import { findChild, otherChildren } from "./_internal";

function AlertTitle(_props: React.ComponentProps<"div">) {
  return null; // read by <Alert>
}
function AlertDescription(_props: React.ComponentProps<"div">) {
  return null; // read by <Alert>
}

/** Alert on Ant Design. A leading icon element, AlertTitle and AlertDescription children are mapped to Ant props. */
function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "destructive" | "success" | "warning" | "info" }) {
  const title = findChild<React.ComponentProps<"div">>(children, AlertTitle);
  const description = findChild<React.ComponentProps<"div">>(children, AlertDescription);
  const icon = otherChildren(children, AlertTitle, AlertDescription)[0];
  const type = variant === "destructive" ? "error" : variant === "default" ? "info" : variant;
  return (
    <AntAlert
      data-slot="alert"
      role="alert"
      type={type}
      showIcon
      icon={icon}
      message={title?.props.children}
      description={description?.props.children}
      className={cn("w-full", className)}
      {...(props as any)}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
