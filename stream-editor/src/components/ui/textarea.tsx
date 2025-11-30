"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    resize();
  }, [props.value]);

  return (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={cn(
        "border-none placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 max-h-72 w-full bg-transparent transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
        className,
      )}
      onInput={resize}
      {...props}
    />
  );
}

export { Textarea };
