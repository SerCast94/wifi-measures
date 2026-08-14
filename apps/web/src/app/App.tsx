import { Outlet } from "react-router";

import { Toaster } from "@/core/atomic-components/sonner";
import ErrorBoundary from "@/core/components/ErrorBoundary";
import CustomSuspense from "@/core/components/CustomSuspense";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { ThemeProvider } from "@/core/providers/ThemeProvider/ThemeProvider";
import Loader from "@/core/providers/CustomScreenLoaderProvider/CustomScreenLoader";
import { LoaderProvider } from "@/core/providers/CustomScreenLoaderProvider/CustomScreenLoaderProvider";
import { ConfirmationModalProvider } from "@/core/providers/ConfirmationModalProvider/ConfirmationModalProvider";

import "@/styles/app-base.css";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <AuthProvider>
          <LoaderProvider>
            <ConfirmationModalProvider>
              <CustomSuspense>
                <Outlet />
              </CustomSuspense>
            </ConfirmationModalProvider>
            <Loader />
          </LoaderProvider>
        </AuthProvider>
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
