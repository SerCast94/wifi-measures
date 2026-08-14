import { lazy } from "react";
import { Outlet } from "react-router";

import type { RouteItemType } from "@/config/routes.config";

const MeasurePage = lazy(() => import("./MeasurePage"));

const SubmissionsPagesRoute: RouteItemType = {
  path: "measures",
  element: <Outlet />,
  children: [
    {
      path: ":measureId",
      element: <MeasurePage />,
    },
  ],
};

export default SubmissionsPagesRoute;
