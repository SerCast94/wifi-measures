import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useUiMeasureStore } from "../../store/ui-measure.store";

interface AllCardsCollapsableChecksProps {
  activeTab: string;
}

export const AllCardsCollapsableChannels = ({
  activeTab,
}: AllCardsCollapsableChecksProps) => {
  const toggleAllCards = useUiMeasureStore(
    (state) => state.toggleAllCollapsableCardsOpen
  );
  const allCardsOpen = useUiMeasureStore(
    (state) => state.allCollapsableCardsOpen
  );

  if (activeTab !== "channels") {
    return null;
  }

  return (
    <Button
      size="icon"
      title={
        allCardsOpen ? "Cerrar todos los canales" : "Abrir todos los canales"
      }
      onClick={toggleAllCards}
      className="transition-all duration-300 ease-in-out fade-in animate-in"
    >
      {allCardsOpen ? (
        <EyeOffIcon className="w-4 h-4" />
      ) : (
        <EyeIcon className="w-4 h-4" />
      )}
    </Button>
  );
};
