import { useCallback, useEffect, useRef, useState } from "react";

interface AnimatedTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (value: string) => void;
}

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onChange,
}: AnimatedTabsProps) => {
  const [mounted, setMounted] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  // Función para manejar el scroll del indicador
  const handleScroll = useCallback(() => {
    const activeTabIndex = tabs.findIndex((tab) => tab.value === activeTab);
    if (
      activeTabIndex !== -1 &&
      tabRefs.current[activeTabIndex] &&
      indicatorRef.current &&
      containerRef.current
    ) {
      const tabElement = tabRefs.current[activeTabIndex];
      const { offsetLeft, offsetWidth } = tabElement!;
      const { scrollLeft } = containerRef.current;
      indicatorRef.current.style.left = `${offsetLeft - scrollLeft}px`;
      indicatorRef.current.style.width = `${offsetWidth}px`;
      indicatorRef.current.style.opacity = "1";
    }
  }, [activeTab, tabs]);

  // Actualizar el scroll del indicador al montar el componente
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    handleScroll();
  }, [handleScroll, mounted]);

  // Actualizar el scroll del indicador al cambiar de pestaña
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Scroll automático al cambiar de pestaña
  useEffect(() => {
    const activeTabIndex = tabs.findIndex((tab) => tab.value === activeTab);
    if (activeTabIndex !== -1 && tabRefs.current[activeTabIndex]) {
      tabRefs.current[activeTabIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="relative mb-4">
      <div
        ref={containerRef}
        className="flex py-2 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => onChange(tab.value)}
            className="relative flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium transition-colors"
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indicador animado */}
      <div
        ref={indicatorRef}
        className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out opacity-0"
      />
    </div>
  );
};
