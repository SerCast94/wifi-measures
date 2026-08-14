import { useState } from "react";

import { type LucideIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent, CardHeader } from "@/core/atomic-components/card";

interface CollapsablePanelProps {
  icon: LucideIcon;
  title: string;
  hideOnlyContent?: boolean;
  className?: string;
  children: React.ReactNode;
  defaultMinimized?: boolean;
  disabled?: boolean;
}

export default function CollapsablePanel({
  icon: Icon,
  title,
  hideOnlyContent = true,
  className,
  children,
  defaultMinimized = false,
  disabled = false,
}: CollapsablePanelProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);

  const toggleMinimize = () => {
    if (disabled) return;
    setIsMinimized(!isMinimized);
  };

  return (
    <Card
      className={cn(
        "shadow-lg border overflow-hidden transition-all duration-300 ease-in-out",
        isMinimized && !hideOnlyContent
          ? "max-w-[48px] rounded-full"
          : "max-w-sm",
        className
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center gap-2 p-2 px-4 cursor-pointer hover:bg-opacity-70 space-y-0",
          isMinimized && !hideOnlyContent && "flex-col p-0 mt-1"
        )}
        onClick={toggleMinimize}
      >
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 pt-1 hover:bg-transparent hover:opacity-70 hover:text-opacity-70"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            toggleMinimize();
          }}
        >
          <Icon className="w-8 h-8" />
        </Button>

        <div
          className={cn(
            "font-bold text-sm transition-all duration-300 ease-in-out",
            isMinimized && !hideOnlyContent
              ? "animate-fade-out opacity-0 h-0 overflow-hidden"
              : "animate-fade-in opacity-100"
          )}
        >
          {title}
        </div>
      </CardHeader>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isMinimized
            ? "animate-collapse max-h-0 opacity-0"
            : "animate-expand max-h-[500px] opacity-100"
        )}
      >
        <CardContent className="p-0 m-0">{children}</CardContent>
      </div>
    </Card>
  );
}
