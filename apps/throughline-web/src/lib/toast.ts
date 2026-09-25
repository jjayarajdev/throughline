"use client";
import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";

/**
 * App-wide toasts on Ant Design's message / notification, exposed as a plain module
 * (`toast.success("…")`) so services, hooks and components can call it without a hook.
 * The instances are provided by <ToastBridge> (rendered inside Ant's <App> in providers.tsx).
 */
let messageApi: MessageInstance | null = null;
let notificationApi: NotificationInstance | null = null;

export function registerToastApis(message: MessageInstance, notification: NotificationInstance) {
  messageApi = message;
  notificationApi = notification;
}

type Content = string | React.ReactNode;
type Options = { description?: Content; duration?: number };

function show(type: "success" | "error" | "info" | "warning" | "loading", content: Content, opts?: Options) {
  if (!messageApi) {
    if (typeof window !== "undefined") console[type === "error" ? "error" : "log"](`[toast:${type}]`, content);
    return;
  }
  if (opts?.description && notificationApi) {
    notificationApi[type === "loading" ? "info" : type]({ message: content, description: opts.description, duration: opts.duration ?? 4.5 });
    return;
  }
  messageApi.open({ type, content, duration: opts?.duration ?? (type === "error" ? 4 : 3) });
}

export const toast = Object.assign((content: Content, opts?: Options) => show("info", content, opts), {
  success: (content: Content, opts?: Options) => show("success", content, opts),
  error: (content: Content, opts?: Options) => show("error", content, opts),
  info: (content: Content, opts?: Options) => show("info", content, opts),
  warning: (content: Content, opts?: Options) => show("warning", content, opts),
  loading: (content: Content, opts?: Options) => show("loading", content, opts),
  dismiss: () => messageApi?.destroy(),
  /** Rich notification with a title and body. */
  notify: (title: Content, description: Content, type: "success" | "error" | "info" | "warning" = "info") =>
    notificationApi?.[type]({ message: title, description }),
});

export default toast;
