import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-4 rounded-pill bg-white border border-[var(--color-neutral-300)] text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-neutral-600)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-purple)] transition-colors",
        invalid && "border-red-500",
        className,
      )}
      {...props}
    />
  );
});
