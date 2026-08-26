import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const FilesPage = lazy(() => import("./FilesPage"));

const FilesPageRoute: RouteItemType = {
  path: "files",
  element: <Outlet />,
  children: [
    {
      path: "",
      element: <FilesPage />,
    },
  ],
};

export default FilesPageRoute;
