import { lazy } from "react";
import { Outlet } from "react-router";

import { type RouteItemType } from "@/config/routes.config";

const UsersPage = lazy(() => import("./users/UsersPage"));

const SubmissionsPagesRoute: RouteItemType = {
  path: "admin",
  element: <Outlet />,
  children: [
    {
      path: "users",
      element: <UsersPage />,
    },
  ],
};

export default SubmissionsPagesRoute;
