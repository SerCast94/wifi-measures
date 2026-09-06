import { useParams } from "react-router";

import { ExteriorHeatmapDetail } from "@/features/exterior-heatmaps/components/ExteriorHeatmapDetail";

const LoraHeatmapDetailPage = () => {
  const { heatmapId } = useParams<{ heatmapId: string }>();
  return (
    <ExteriorHeatmapDetail
      heatmapId={heatmapId ?? ""}
      backTo="/lora/map"
      backLabel="Mapas de calor exterior LoRa"
      withFloorPlan
    />
  );
};

export default LoraHeatmapDetailPage;