"use client";
import * as React from "react";
import { Tabs as AntTabs } from "antd";
import { cn } from "@/lib/utils";
import { findChildren } from "./_internal";

type TabsCtx = { value: string; setValue: (v: string) => void };
const Ctx = React.createContext<TabsCtx>({ value: "", setValue: () => {} });

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  activationMode?: "automatic" | "manual";
};

/**
 * Tabs on Ant Design, keeping the Radix compound API. <TabsList> renders the Ant tab bar
 * from its <TabsTrigger> children; <TabsContent> renders wherever it sits in the tree.
 */
function Tabs({ className, value, defaultValue, onValueChange, children, orientation: _o, activationMode: _a, ...props }: TabsProps) {
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const current = controlled ? value! : inner;
  const setValue = React.useCallback(
    (v: string) => {
      if (!controlled) setInner(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange]
  );
  const ctx = React.useMemo(() => ({ value: current, setValue }), [current, setValue]);
  return (
    <Ctx.Provider value={ctx}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

type TriggerProps = React.ComponentProps<"button"> & { value: string };

function TabsTrigger(_props: TriggerProps) {
  return null; // read by <TabsList>
}

function TabsList({ className, children, ...props }: React.ComponentProps<"div">) {
  const { value, setValue } = React.useContext(Ctx);
  const triggers = findChildren<TriggerProps>(children, TabsTrigger);
  const items = triggers.map((t) => ({
    key: t.props.value,
    label: <span className={cn("inline-flex items-center gap-1.5", t.props.className)}>{t.props.children}</span>,
    disabled: t.props.disabled,
  }));
  return (
    <div data-slot="tabs-list" className={cn("w-fit max-w-full", className)} {...props}>
      <AntTabs
        activeKey={value}
        onChange={setValue}
        items={items}
        size="middle"
        tabBarStyle={{ marginBottom: 0 }}
        renderTabBar={(barProps, DefaultBar) => <DefaultBar {...barProps} />}
      />
    </div>
  );
}

function TabsContent({ className, value, children, forceMount, ...props }: React.ComponentProps<"div"> & { value: string; forceMount?: boolean }) {
  const ctx = React.useContext(Ctx);
  const active = ctx.value === value;
  if (!active && !forceMount) return null;
  return (
    <div data-slot="tabs-content" role="tabpanel" hidden={!active} className={cn("flex-1 outline-none", className)} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
