import { lazy } from "react";

const LazyAuthLayout = lazy(
  () => import("@/core/layouts/AuthLayout/AuthLayout")
);

export default LazyAuthLayout;
