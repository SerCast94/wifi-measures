import { useState } from "react";

import clsx from "clsx";

import useTimeout from "@/core/hooks/useTimeout";

export type CustomLoadingProps = {
  delay?: number;
  className?: string;
};

/**
 * CustomLoading displays a loading state with an optional delay
 */
function CustomLoading(props: CustomLoadingProps) {
  const { delay = 0, className } = props;
  const [showLoading, setShowLoading] = useState(!delay);

  useTimeout(() => {
    setShowLoading(true);
  }, delay);

  return (
    <div
      className={clsx(
        className,
        "flex flex-1 min-h-full h-full w-full self-center flex-col items-center justify-center p-24 animate-fade-in bg-background",
        !showLoading ? "hidden" : ""
      )}
    >
      <div className="text-secondary" id="spinner">
        <div className="bounce1 bg-primary" />
        <div className="bounce2 bg-primary" />
        <div className="bounce3 bg-primary" />
      </div>
    </div>
  );
}

export default CustomLoading;
