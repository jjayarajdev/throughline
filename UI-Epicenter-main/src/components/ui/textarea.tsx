"use client";
import * as React from "react";
import { Input as AntInput } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(function Textarea(
  { className, rows = 3, ...props },
  ref
) {
  const antRef = React.useRef<TextAreaRef>(null);
  React.useImperativeHandle(ref, () => antRef.current?.resizableTextArea?.textArea as HTMLTextAreaElement, []);
  return <AntInput.TextArea ref={antRef} data-slot="textarea" rows={rows} className={cn("w-full", className)} {...(props as any)} />;
});

export { Textarea };
