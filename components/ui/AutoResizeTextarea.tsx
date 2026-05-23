"use client";

import { useEffect, useRef, forwardRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ onChange, value, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [value, ref]);

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        style={{ resize: "none", overflow: "hidden" }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";
export default AutoResizeTextarea;
