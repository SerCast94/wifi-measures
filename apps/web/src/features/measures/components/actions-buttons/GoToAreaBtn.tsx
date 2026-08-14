import { forwardRef } from "react";

import { Link } from "react-router";
import { LogInIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/atomic-components/button";

interface GoToAreaBtnProps {
  areaId: string;
  className?: string;
  withLabel?: boolean;
  title?: string;
}

export const GoToAreaBtn = forwardRef<HTMLAnchorElement, GoToAreaBtnProps>(
  ({ areaId, className, withLabel = false, title = "Ir a Área" }, ref) => {
    return (
      <Link ref={ref} to={`/areas/${areaId}`} className={className}>
        <Button
          size={withLabel ? "sm" : "icon"}
          variant={withLabel ? "ghost" : "default"}
          title={title}
          className={cn(
            `flex items-center justify-start w-full`,
            withLabel ? "px-0" : "px-3 bg-yellow-500 text-foreground"
          )}
        >
          <LogInIcon className="w-4 h-4" />
          {withLabel && <span>{title}</span>}
        </Button>
      </Link>
    );
  }
);
