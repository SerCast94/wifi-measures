import { lazy } from "react";

import { type RouteItemType } from "@/config/routes.config";

const Profile = lazy(() => import("./ProfilePage"));

const ProfileRoute: RouteItemType = {
  path: "/profile",
  index: true,
  element: <Profile />,
};

export default ProfileRoute;
