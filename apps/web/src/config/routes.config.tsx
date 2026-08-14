import { Navigate, type RouteObject } from "react-router-dom";

import App from "@/app/App";
import SignInPage from "@/app/(auth)/login/SignInPage";
import ErrorBoundary from "@/core/components/ErrorBoundary";
import AuthLayout from "@/core/layouts/AuthLayout/AuthLayout";
import LazyMainLayout from "@/core/layouts/MainLayout/LazyMainLayout";

export type RouteItemType = RouteObject & {
  children?: RouteItemType[];
};

/**
 * The RoutesType type is a custom type that is an array of RouteItemType objects.
 */
export type RoutesType = RouteItemType[];

/**
 * The RouteConfigType type is a custom type that defines the configuration for a set of routes.
 * It includes an optional routes property, an optional settings property, and an optional auth property.
 */
export type RouteConfigType = {
  routes: RoutesType;
};

/**
 * The RouteConfigsType type is a custom type that is an array of RouteConfigType objects.
 */
export type RouteConfigsType = RouteConfigType[] | [];

const protectedModules: Record<string, unknown> = import.meta.glob(
  "/src/app/**/*Route.tsx",
  {
    eager: true,
  }
);

const homeRoutes: RouteConfigType[] = Object.keys(protectedModules)
  .map((modulePath) => {
    const moduleConfigs = (
      protectedModules[modulePath] as {
        default: RouteConfigType | RouteConfigType[];
      }
    ).default;
    return Array.isArray(moduleConfigs) ? moduleConfigs : [moduleConfigs];
  })
  .flat();

const routes: RoutesType = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "auth/*",
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <SignInPage />,
          },
          {
            path: "*",
            element: <Navigate to="/auth/login" replace />,
          },
        ],
      },
      {
        path: "",
        element: <LazyMainLayout />,
        children: [
          {
            path: "",
            index: true,
            element: <Navigate to="/home" replace />,
          },
          ...homeRoutes,
          {
            path: "*",
            element: <Navigate to="/home" replace />,
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/home" replace />,
  },
];

export default routes;
