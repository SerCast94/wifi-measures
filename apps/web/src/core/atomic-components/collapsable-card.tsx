import { useState, type ReactNode, useEffect } from "react";

import { ChevronDown } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

interface CollapsableCardProps {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function CollapsableCard({
  title,
  description,
  icon,
  defaultOpen = false,
  open,
  children,
}: CollapsableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  return (
    <Card className="p-0 m-0 overflow-hidden">
      <CardHeader
        className="flex flex-col px-4 py-2 cursor-pointer bg-primary text-primary-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center text-base font-semibold">
              {icon && <span className="w-5 h-5 mr-2">{icon}</span>}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 mr-2 transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="pt-4">{children}</CardContent>
      </div>
    </Card>
  );
}
