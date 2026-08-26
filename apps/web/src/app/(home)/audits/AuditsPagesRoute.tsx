import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const AuditsPage = lazy(() => import("./AuditsPage"));
const NewAuditPage = lazy(() => import("./new/NewAuditPage"));
const ComparativaPage = lazy(() => import("./comparativa/ComparativaPage"));
const AuditDashboardPage = lazy(() => import("./[auditId]/AuditDashboardPage"));
const AuditConfigPage = lazy(() => import("./[auditId]/config/AuditConfigPage"));
const AuditTestsPage = lazy(() => import("./[auditId]/tests/AuditTestsPage"));
const AuditEditPage = lazy(() => import("./[auditId]/editar/AuditEditPage"));
const AuditIssuesPage = lazy(
  () => import("./[auditId]/incidencias/AuditIssuesPage")
);
const AuditReportPage = lazy(() => import("./[auditId]/informe/AuditReportPage"));
const AuditDetailsPage = lazy(
  () => import("./[auditId]/detalles/AuditDetailsPage")
);

const AuditsPagesRoute: RouteItemType = {
  path: "audits",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <AuditsPage />,
    },
    {
      path: "new",
      element: <NewAuditPage />,
    },
    {
      path: "comparativa",
      element: <ComparativaPage />,
    },
    {
      path: ":auditId",
      element: <Outlet />,
      children: [
        { path: "", element: <AuditDashboardPage /> },
        { path: "config", element: <AuditConfigPage /> },
        { path: "tests", element: <AuditTestsPage /> },
        { path: "incidencias", element: <AuditIssuesPage /> },
        { path: "detalles", element: <AuditDetailsPage /> },
        { path: "editar", element: <AuditEditPage /> },
        { path: "informe", element: <AuditReportPage /> },
      ],
    },
  ],
};

export default AuditsPagesRoute;
