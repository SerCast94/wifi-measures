import * as React from "react";

import { cn } from "@/core/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <>
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : "border-input",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm font-bold text-destructive">
            {error ||
              "Error al intentar agregar la tarea. Por favor, intenta de nuevo más tarde."}
          </p>
        )}
      </>
    );
  }
);
Input.displayName = "Input";

export { Input };
