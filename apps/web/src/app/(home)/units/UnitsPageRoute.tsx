import { lazy } from "react";

import { type RouteItemType } from "@/config/routes.config";

const UnitsPage = lazy(() => import("./UnitsPage"));

const UnitsPageRoute: RouteItemType = {
  path: "units",
  element: <UnitsPage />,
};

export default UnitsPageRoute;