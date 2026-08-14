import { lazy } from "react";

import { type RouteItemType } from "@/config/routes.config";

const MapPage = lazy(() => import("./MapPage"));

const MapPagesRoute: RouteItemType = {
  path: "/map",
  index: true,
  element: <MapPage />,
};

export default MapPagesRoute;
