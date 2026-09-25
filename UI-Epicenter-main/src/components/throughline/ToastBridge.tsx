"use client";
import { App } from "antd";
import { useEffect } from "react";
import { registerToastApis } from "@/lib/toast";

/** Hands Ant's message/notification instances to the module-level `toast` helper. Render inside <App>. */
export default function ToastBridge() {
  const { message, notification } = App.useApp();
  useEffect(() => {
    registerToastApis(message, notification);
  }, [message, notification]);
  return null;
}
