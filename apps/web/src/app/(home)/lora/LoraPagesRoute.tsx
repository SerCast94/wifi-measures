import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const LoraAuditsPage = lazy(() => import("./LoraAuditsPage"));
const LoraNewAuditPage = lazy(() => import("./new/LoraNewAuditPage"));
const LoraMeasuresPage = lazy(() => import("./medidas/LoraMeasuresPage"));
const LoraNoisePage = lazy(() => import("./ruido/LoraNoisePage"));
const LoraAuditDetailPage = lazy(() => import("./[auditId]/LoraAuditDetailPage"));
const LoraAuditAnalysisPage = lazy(
  () => import("./[auditId]/analisis/LoraAuditAnalysisPage")
);
const LoraMapPage = lazy(() => import("./map/LoraMapPage"));

const LoraPagesRoute: RouteItemType = {
  path: "lora",
  element: <Outlet />,
  children: [
    { path: "", element: <LoraAuditsPage /> },
    { path: "new", element: <LoraNewAuditPage /> },
    { path: "medidas", element: <LoraMeasuresPage /> },
    { path: "ruido", element: <LoraNoisePage /> },
    { path: "map", element: <LoraMapPage /> },
    { path: ":auditId/analisis", element: <LoraAuditAnalysisPage /> },
    { path: ":auditId", element: <LoraAuditDetailPage /> },
  ],
};

export default LoraPagesRoute;
