import { lazy } from "react";

const LazyMainLayout = lazy(
  () => import("@/core/layouts/MainLayout/MainLayout")
);

export default LazyMainLayout;
