import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const SurveysPage = lazy(() => import("./SurveysPage"));
const SurveyPage = lazy(() => import("./[surveyId]/SurveyPage"));
const WifiMapPage = lazy(() => import("./map/WifiMapPage"));
const WifiHeatmapDetailPage = lazy(
  () => import("./map/[heatmapId]/WifiHeatmapDetailPage")
);

const SurveysPagesRoute: RouteItemType = {
  path: "surveys",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <SurveysPage />,
    },
    {
      path: "map",
      element: <WifiMapPage />,
    },
    {
      path: "map/:heatmapId",
      element: <WifiHeatmapDetailPage />,
    },
    {
      path: ":surveyId",
      element: <SurveyPage />,
    },
  ],
};

export default SurveysPagesRoute;