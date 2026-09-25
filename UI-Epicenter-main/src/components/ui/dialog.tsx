"use client";
import * as React from "react";
import { Modal } from "antd";
import { cn } from "@/lib/utils";
import { findChild, otherChildren, renderTrigger, useOpenState } from "./_internal";

type DialogCtx = { open: boolean; setOpen: (o: boolean) => void };
const Ctx = React.createContext<DialogCtx>({ open: false, setOpen: () => {} });

type DialogProps = { children?: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; modal?: boolean };

/**
 * Dialog on Ant Design's Modal, keeping the Radix compound API:
 *   <Dialog open onOpenChange><DialogTrigger asChild/><DialogContent>…</DialogContent></Dialog>
 */
function Dialog({ children, ...state }: DialogProps) {
  const [open, setOpen] = useOpenState(state);
  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const DialogTrigger = React.forwardRef<HTMLElement, React.ComponentProps<"button"> & { asChild?: boolean }>(function DialogTrigger(props, ref) {
  const { setOpen } = React.useContext(Ctx);
  return renderTrigger(props as any, () => setOpen(true), ref);
});

const DialogClose = React.forwardRef<HTMLElement, React.ComponentProps<"button"> & { asChild?: boolean }>(function DialogClose(props, ref) {
  const { setOpen } = React.useContext(Ctx);
  return renderTrigger(props as any, () => setOpen(false), ref);
});

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function DialogOverlay(_props: React.ComponentProps<"div">) {
  return null;
}

type ContentProps = React.ComponentProps<"div"> & {
  onOpenAutoFocus?: (e: Event) => void;
  onCloseAutoFocus?: (e: Event) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  onPointerDownOutside?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
  showCloseButton?: boolean;
};

function DialogContent({ className, children, showCloseButton = true, onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onInteractOutside, ...props }: ContentProps) {
  const { open, setOpen } = React.useContext(Ctx);
  const title = findChild<React.ComponentProps<"div">>(children, DialogTitle) ?? findChild(findChild<React.ComponentProps<"div">>(children, DialogHeader)?.props.children, DialogTitle);
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      centered
      closable={showCloseButton}
      destroyOnHidden
      width="100%"
      style={{ maxWidth: "calc(100% - 2rem)", paddingBottom: 0 }}
      styles={{ container: { padding: 0, background: "transparent", boxShadow: "none" }, body: { padding: 0 } }}
      title={null}
      aria-label={typeof title?.props.children === "string" ? title.props.children : undefined}
    >
      <div
        data-slot="dialog-content"
        className={cn(
          "relative mx-auto grid w-full gap-4 rounded-lg border border-[var(--ant-color-border-secondary)] bg-[var(--ant-color-bg-elevated)] p-6 shadow-lg sm:max-w-lg text-[var(--ant-color-text)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </Modal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />;
}
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />;
}
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-sm text-[var(--ant-color-text-secondary)]", className)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
