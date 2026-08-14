import {
  useEffect,
  memo,
  useMemo,
  useCallback,
  createContext,
  useContext,
  useState,
  forwardRef,
  Children,
  isValidElement,
} from "react";

import { MenuIcon, XIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/core/atomic-components/sheet";
import { useIsMobile } from "@/core/hooks/useIsMobile";

const LEFT_PANEL_WIDTH = "20rem";
const LEFT_PANEL_WIDTH_MOBILE = "18rem";
const RIGHT_PANEL_WIDTH = "24rem";

type FlexibleLayoutContext = {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  isMobile: boolean;

  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
};

const FlexibleLayoutContext = createContext<FlexibleLayoutContext | null>(null);

function useFlexibleLayout() {
  const context = useContext(FlexibleLayoutContext);
  if (!context) {
    throw new Error(
      "useFlexibleLayout must be used within a FlexibleLayoutProvider."
    );
  }

  return context;
}

const FlexibleLayoutProvider = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultLeftPanelOpened?: boolean;
    defaultRightPanelOpened?: boolean;
    onLeftPanelOpenChange?: (open: boolean) => void;
    onRightPanelOpenChange?: (open: boolean) => void;
    openLeftPanel?: boolean;
    openRightPanel?: boolean;
  }
>(
  (
    {
      defaultLeftPanelOpened: defaultLeftPanelOpen = true,
      defaultRightPanelOpened: defaultRightPanelOpen = true,
      openLeftPanel: openLeftProp,
      openRightPanel: openRightProp,
      onLeftPanelOpenChange: setOpenLeftProp,
      onRightPanelOpenChange: setOpenRightProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();

    // This is the internal state of the flexible layout.
    // We use openProp and setOpenProp for control from outside the component.
    const [_leftPanelOpen, _setLeftPanelOpen] = useState(defaultLeftPanelOpen);
    const [_rightPanelOpen, _setRightPanelOpen] = useState(
      defaultRightPanelOpen
    );
    const leftPanelOpened = openLeftProp ?? _leftPanelOpen;
    const rightPanelOpened = openRightProp ?? _rightPanelOpen;

    const setLeftOpen = useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        _setLeftPanelOpen((prev) =>
          typeof value === "function" ? value(prev) : value
        );
        if (setOpenLeftProp) {
          setOpenLeftProp(
            typeof value === "function" ? value(_leftPanelOpen) : value
          );
        }
      },
      [setOpenLeftProp, _leftPanelOpen]
    );

    // Helper to toggle the left panel
    const toggleLeftPanel = useCallback(() => {
      return setLeftOpen((open) => !open);
    }, [setLeftOpen]);

    const setRightOpen = useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        _setRightPanelOpen((prev) =>
          typeof value === "function" ? value(prev) : value
        );
        if (setOpenRightProp) {
          setOpenRightProp(
            typeof value === "function" ? value(_rightPanelOpen) : value
          );
        }
      },
      [setOpenRightProp, _rightPanelOpen]
    );

    // Helper to toggle the right panel.
    const toggleRightPanel = useCallback(() => {
      return setRightOpen((open) => !open);
    }, [setRightOpen]);

    // Open the left panel by default on desktop.
    useEffect(() => {
      if (!isMobile) {
        setLeftOpen(leftPanelOpened);
      }
    }, [isMobile, setLeftOpen, leftPanelOpened]);

    // Memoize the style object to prevent unnecessary re-renders
    const memoizedStyle = useMemo(() => {
      return {
        "--flexible-layout-leftPanel-width": LEFT_PANEL_WIDTH,
        "--flexible-layout-rightPanel-width": RIGHT_PANEL_WIDTH,
        ...style,
      } as React.CSSProperties;
    }, [style]);

    const contextValue = useMemo<FlexibleLayoutContext>(
      () => ({
        leftPanelOpen: leftPanelOpened,
        rightPanelOpen: rightPanelOpened,
        setLeftPanelOpen: setLeftOpen,
        setRightPanelOpen: setRightOpen,
        isMobile,
        toggleLeftPanel,
        toggleRightPanel,
      }),
      [
        leftPanelOpened,
        rightPanelOpened,
        isMobile,
        setLeftOpen,
        setRightOpen,
        toggleLeftPanel,
        toggleRightPanel,
      ]
    );

    return (
      <FlexibleLayoutContext.Provider value={contextValue}>
        <div
          style={memoizedStyle}
          className={cn(
            "group/flexible-layout-wrapper flex h-full w-full",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </FlexibleLayoutContext.Provider>
    );
  }
);
FlexibleLayoutProvider.displayName = "FlexibleLayoutProvider";

const FlexibleLeftPanel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {}
>(({ className, children, ...props }, ref) => {
  const { isMobile, leftPanelOpen, setLeftPanelOpen } = useFlexibleLayout();

  useEffect(() => {
    document.body.style.overflow = leftPanelOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto"; // Restore when closed
    };
  }, [leftPanelOpen]);

  // Memoize the style object for mobile view
  const mobileStyle = useMemo(() => {
    return {
      "--flexible-layout-leftPanel-width": LEFT_PANEL_WIDTH_MOBILE,
    } as React.CSSProperties;
  }, []);

  if (isMobile) {
    return (
      <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen} {...props}>
        <SheetHeader>
          <SheetTitle>{props.title}</SheetTitle>
          <SheetDescription>{props["aria-description"]}</SheetDescription>
        </SheetHeader>
        <SheetContent
          data-mobile="true"
          className="w-[--flexible-layout-leftPanel-width] bg-flexible-layout-leftPanel p-0 text-flexible-layout-leftPanel-foreground [&>button]:hidden"
          style={mobileStyle}
          side="left"
        >
          <div className={cn(`flex flex-col w-full h-full`, className)}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "absolute z-10 w-[--flexible-layout-leftPanel-width] bg-flexible-layout-leftPanel text-flexible-layout-leftPanel-foreground h-full border-r shadow-lg overflow-auto transition-all duration-300 ease-in-out",
        leftPanelOpen ? "translate-x-0 relative" : "-translate-x-full",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});
FlexibleLeftPanel.displayName = "FlexibleLeftPanel";

const FlexibleRightPanel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {}
>(({ className, children, ...props }, ref) => {
  const { isMobile, rightPanelOpen } = useFlexibleLayout();

  useEffect(() => {
    document.body.style.overflow = rightPanelOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto"; // Restore when closed
    };
  }, [rightPanelOpen]);

  return (
    <div
      className={cn(
        `overflow-auto transition-all bg-flexible-layout-rightPanel text-flexible-layout-leftPanel-foreground duration-300 ease-in-out absolute right-0 z-20 h-full border-l shadow-lg`,
        isMobile ? "w-full" : "w-[--flexible-layout-rightPanel-width]",
        rightPanelOpen ? "translate-x-0 relative" : "translate-x-full",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});
FlexibleRightPanel.displayName = "FlexibleRightPanel";

// Memoize components that don't need to re-render when parent re-renders
const FlexibleLayout = memo(({ children }: { children: React.ReactNode }) => {
  const leftPanel = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === FlexibleLeftPanel
  );
  const rightPanel = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === FlexibleRightPanel
  );
  const mainContent = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === FlexibleMainContent
  );

  return (
    <div className="flex w-full h-full overflow-hidden">
      {leftPanel}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out mr-0`}
      >
        {mainContent}
      </div>
      {rightPanel}
    </div>
  );
});
FlexibleLayout.displayName = "FlexibleLayout";

const FlexibleMainContent = memo(
  ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    return (
      <div className={cn("flex-1 w-full overflow-auto", className)}>
        {children}
      </div>
    );
  }
);
FlexibleMainContent.displayName = "FlexibleMainContent";

const LeftPanelToggleBtn = memo(({ className }: { className?: string }) => {
  const { toggleLeftPanel, leftPanelOpen } = useFlexibleLayout();

  return (
    <button className={className} onClick={toggleLeftPanel}>
      {leftPanelOpen ? (
        <MenuIcon className="w-6 h-6 ml-2" />
      ) : (
        <MenuIcon className="w-6 h-6 ml-2 transform rotate-180" />
      )}
    </button>
  );
});
LeftPanelToggleBtn.displayName = "LeftPanelToggleBtn";

const RightPanelToggleBtn = memo(({ className }: { className?: string }) => {
  const { toggleRightPanel } = useFlexibleLayout();

  return (
    <button className={className} onClick={toggleRightPanel}>
      <XIcon className="w-6 h-6 ml-2" />
    </button>
  );
});
RightPanelToggleBtn.displayName = "RightPanelToggleBtn";

export {
  FlexibleLayoutProvider,
  type FlexibleLayoutContext,
  FlexibleLeftPanel,
  FlexibleRightPanel,
  FlexibleMainContent,
  FlexibleLayout,
  LeftPanelToggleBtn,
  RightPanelToggleBtn,
  // eslint-disable-next-line react-refresh/only-export-components
  useFlexibleLayout,
};
