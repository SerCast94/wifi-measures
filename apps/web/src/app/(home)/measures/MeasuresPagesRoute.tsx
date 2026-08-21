import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const MeasuresPage = lazy(() => import("./MeasuresPage"));
const MeasurePage = lazy(() => import("./[id]/MeasurePage"));

const MeasuresPagesRoute: RouteItemType = {
  path: "measures",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <MeasuresPage />,
    },
    {
      path: ":measureId",
      element: <MeasurePage />,
    },
  ],
};

export default MeasuresPagesRoute;