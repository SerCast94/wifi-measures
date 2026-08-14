import { useState } from "react";

import clsx from "clsx";

import useTimeout from "@/core/hooks/useTimeout";

export type CustomLoading2Props = {
  delay?: number;
  className?: string;
};

/**
 * CustomLoading displays a loading state with an optional delay
 */
function CustomLoading2(props: CustomLoading2Props) {
  const { delay = 0, className } = props;
  const [showLoading, setShowLoading] = useState(!delay);

  useTimeout(() => {
    setShowLoading(true);
  }, delay);

  return (
    <div
      className={clsx(
        className,
        "flex h-full self-center flex-col items-center justify-center animate-fade-in bg-background",
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

export default CustomLoading2;
