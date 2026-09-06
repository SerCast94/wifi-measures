import { useParams } from "react-router";

import { SurveyDetail } from "@/features/surveys/components/SurveyDetail";

const SurveyPage = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  return (
    <SurveyDetail
      surveyId={surveyId ?? ""}
      backTo="/surveys"
      backLabel="Mapas de calor"
      showImport
    />
  );
};

export default SurveyPage;