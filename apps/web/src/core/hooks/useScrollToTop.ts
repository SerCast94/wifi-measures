import { useState, useEffect, useRef } from "react";

type UseScrollToTopReturn = {
  scrollToTop: () => void;
  showButton: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
};

export function useScrollToTop(
  containerRef: React.RefObject<HTMLElement | null>
): UseScrollToTopReturn {
  const [showButton, setShowButton] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowButton(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

  return { scrollToTop, showButton, sentinelRef };
}
