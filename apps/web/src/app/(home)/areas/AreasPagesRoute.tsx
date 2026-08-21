import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const AreasPage = lazy(() => import("./AreasPage"));
const AreaPage = lazy(() => import("./[id]/AreaPage"));
const ReportPage = lazy(() => import("./[id]/reporte/ReportPage"));

const AreasPagesRoute: RouteItemType = {
  path: "areas",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <AreasPage />,
    },
    {
      path: ":areaId",
      element: <AreaPage />,
    },
    {
      path: ":areaId/reporte",
      element: <ReportPage />,
    },
  ],
};

export default AreasPagesRoute;
