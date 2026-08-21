import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const AnalysesPage = lazy(() => import("./AnalysesPage"));
const AnalysisPage = lazy(() => import("./[analysisId]/AnalysisPage"));

const AnalysesPagesRoute: RouteItemType = {
  path: "analyses",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <AnalysesPage />,
    },
    {
      path: ":analysisId",
      element: <AnalysisPage />,
    },
  ],
};

export default AnalysesPagesRoute;