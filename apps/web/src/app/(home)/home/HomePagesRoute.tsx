import { lazy } from "react";

import { type RouteItemType } from "@/config/routes.config";

const HomePage = lazy(() => import("./HomePage"));

const HomePagesRoute: RouteItemType = {
  path: "home",
  element: <HomePage />,
};

export default HomePagesRoute;
