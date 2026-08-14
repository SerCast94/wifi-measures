import { ArrowUpIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/atomic-components/button";

interface ScrollToTopButtonProps {
  scrollToTop: () => void;
  showButton: boolean;
}

export const ScrollToTopButton = ({
  scrollToTop,
  showButton,
}: ScrollToTopButtonProps) => {
  return (
    <>
      {showButton && (
        <Button
          size="icon"
          onClick={scrollToTop}
          className={cn(
            `fixed bottom-10 right-8 duration-300 z-50 ease-in-out transition-all border-background shadow-md border w-12 h-12 animate-in fade-in`
          )}
        >
          <ArrowUpIcon className="w-8 h-8" />
        </Button>
      )}
    </>
  );
};
