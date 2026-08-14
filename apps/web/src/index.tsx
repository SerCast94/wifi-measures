import { createRoot } from "react-dom/client";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import routes from "./config/routes.config";
import queryClient from "./core/lib/queryClient";

import "./index.css";

const container = document.getElementById("app");

if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);

const router = createBrowserRouter(routes);

root.render(
  <QueryClientProvider client={queryClient}>
    <NuqsAdapter>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </NuqsAdapter>
  </QueryClientProvider>
);
