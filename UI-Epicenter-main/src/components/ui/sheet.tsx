"use client";
import * as React from "react";
import { Button, Drawer } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { cn } from "@/lib/utils";
import { renderTrigger, useOpenState } from "./_internal";

type SheetCtx = { open: boolean; setOpen: (o: boolean) => void };
const Ctx = React.createContext<SheetCtx>({ open: false, setOpen: () => {} });

type SheetProps = { children?: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; modal?: boolean };

/** Sheet on Ant Design's Drawer, keeping the Radix compound API. */
function Sheet({ children, ...state }: SheetProps) {
  const [open, setOpen] = useOpenState(state);
  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const SheetTrigger = React.forwardRef<HTMLElement, React.ComponentProps<"button"> & { asChild?: boolean }>(function SheetTrigger(props, ref) {
  const { setOpen } = React.useContext(Ctx);
  return renderTrigger(props as any, () => setOpen(true), ref);
});

const SheetClose = React.forwardRef<HTMLElement, React.ComponentProps<"button"> & { asChild?: boolean }>(function SheetClose(props, ref) {
  const { setOpen } = React.useContext(Ctx);
  return renderTrigger(props as any, () => setOpen(false), ref);
});

function SheetPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function SheetOverlay(_props: React.ComponentProps<"div">) {
  return null;
}

/** Derive the drawer size from the Tailwind width classes consumers pass (w-[800px], sm:max-w-xl, …). */
function widthFromClassName(className?: string, side: string = "right"): string | number {
  const px = className?.match(/(?:^|\s)(?:sm:|md:|lg:)?(?:max-)?w-\[(\d+)px\]/);
  if (px) return Number(px[1]);
  const named = className?.match(/(?:^|\s)(?:sm:|md:|lg:)?max-w-(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)(?:\s|$)/);
  const rem: Record<string, number> = { sm: 24, md: 28, lg: 32, xl: 36, "2xl": 42, "3xl": 48, "4xl": 56, "5xl": 64, "6xl": 72, "7xl": 80 };
  if (named) return `${rem[named[1]]}rem`;
  return side === "left" ? "24rem" : "36rem";
}

type ContentProps = React.ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left"; showCloseButton?: boolean };

function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }: ContentProps) {
  const { open, setOpen } = React.useContext(Ctx);
  const vertical = side === "top" || side === "bottom";
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      placement={side}
      closable={false}
      destroyOnHidden
      {...(vertical ? { height: "auto" } : { width: widthFromClassName(className, side) })}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" }, wrapper: { maxWidth: "100vw" } }}
    >
      <div data-slot="sheet-content" className={cn("relative flex h-full min-h-0 flex-1 flex-col gap-4 text-[var(--ant-color-text)]", className)} {...props}>
        {children}
        {showCloseButton && (
          <Button
            type="text"
            size="small"
            aria-label="Close"
            icon={<CloseOutlined />}
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}
          />
        )}
      </div>
    </Drawer>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}
function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="sheet-title" className={cn("font-semibold", className)} {...props} />;
}
function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="sheet-description" className={cn("text-sm text-[var(--ant-color-text-secondary)]", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetOverlay, SheetPortal };
