"use client";
import * as React from "react";

/**
 * Helpers shared by the Ant Design-backed primitives that keep the shadcn/Radix
 * compound-component API (Dialog > DialogTrigger + DialogContent, Select > SelectItem …).
 * Consumers compose JSX; these primitives read that JSX and feed Ant components.
 */

export type AnyComponent = React.JSXElementConstructor<any> | string;

export function flattenChildren(children: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      out.push(...flattenChildren((child.props as { children?: React.ReactNode }).children));
    } else {
      out.push(child);
    }
  });
  return out;
}

/** True when `el` is an element of one of `types`. Deliberately not a type guard: a guard
 *  would narrow the element to `never` in else-if chains over the same variable. */
export function isElementOf(el: React.ReactNode, ...types: AnyComponent[]): boolean {
  return React.isValidElement(el) && types.some((t) => el.type === t);
}

/** Typed access to an element's props after an `isElementOf` check. */
export function propsOf<P>(el: React.ReactNode): P {
  return (React.isValidElement(el) ? el.props : {}) as P;
}

export function findChild<P = any>(children: React.ReactNode, ...types: AnyComponent[]) {
  return flattenChildren(children).find((c) => isElementOf(c, ...types)) as
    | React.ReactElement<P>
    | undefined;
}

export function findChildren<P = any>(children: React.ReactNode, ...types: AnyComponent[]) {
  return flattenChildren(children).filter((c) => isElementOf(c, ...types)) as React.ReactElement<P>[];
}

export function otherChildren(children: React.ReactNode, ...types: AnyComponent[]) {
  return flattenChildren(children).filter((c) => !isElementOf(c, ...types));
}

/** Compose two event handlers; the consumer's runs first. */
export function composeHandlers<E>(theirs?: (e: E) => void, ours?: (e: E) => void) {
  return (e: E) => {
    theirs?.(e);
    if (!(e as unknown as { defaultPrevented?: boolean })?.defaultPrevented) ours?.(e);
  };
}

/**
 * Render a "trigger" the Radix way: with asChild the child element is used as the
 * trigger itself, otherwise the children are wrapped in a button.
 */
export function renderTrigger(
  props: { asChild?: boolean; children?: React.ReactNode; className?: string; [k: string]: unknown },
  onActivate: () => void,
  ref?: React.Ref<HTMLElement>
): React.ReactElement {
  const { asChild, children, className, ...rest } = props;
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...rest,
      ref,
      className: [child.props.className, className].filter(Boolean).join(" ") || undefined,
      onClick: composeHandlers(child.props.onClick, onActivate),
    });
  }
  return (
    <button type="button" ref={ref as React.Ref<HTMLButtonElement>} className={className} {...rest} onClick={composeHandlers(rest.onClick as any, onActivate)}>
      {children}
    </button>
  );
}

/** Controlled/uncontrolled open state, Radix style (open / defaultOpen / onOpenChange). */
export function useOpenState(props: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next);
      props.onOpenChange?.(next);
    },
    [controlled, props.onOpenChange]
  );
  return [open, setOpen] as const;
}

/** Map Radix `align`/`side` to an Ant `placement`. */
export function toPlacement(side: string = "bottom", align: string = "center") {
  const suffix = align === "start" ? "Left" : align === "end" ? "Right" : "";
  if (side === "left" || side === "right") {
    const s = align === "start" ? "Top" : align === "end" ? "Bottom" : "";
    return `${side}${s}` as const;
  }
  return `${side}${suffix}` as any;
}
