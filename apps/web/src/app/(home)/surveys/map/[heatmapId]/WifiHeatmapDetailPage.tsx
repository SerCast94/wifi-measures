import { useParams } from "react-router";

import { SurveyDetail } from "@/features/surveys/components/SurveyDetail";

const WifiHeatmapDetailPage = () => {
  const { heatmapId } = useParams<{ heatmapId: string }>();
  return (
    <SurveyDetail
      surveyId={heatmapId ?? ""}
      backTo="/surveys/map"
      backLabel="Mapas de calor exterior — Wi-Fi"
    />
  );
};

export default WifiHeatmapDetailPage;