import { RefreshCwIcon } from "lucide-react";

import error500 from "@/assets/images/error-500.svg";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";

interface InternalErrorProps {
  message?: string;
  onRetry?: () => void;
}

const InternalError = ({ message, onRetry }: InternalErrorProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh_-_80px)] p-6">
      <Card className="max-w-lg p-6 text-center bg-white shadow-xl dark:bg-gray-800 rounded-2xl animate-fade-in">
        <img
          src={error500}
          alt="Error Occurred"
          className="w-64 mx-auto animate-pulse"
        />
        <CardContent className="mt-2">
          <h1 className="text-2xl font-bold text-red-800 dark:text-red-400">
            ¡Oops! Algo salió mal
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Parece que ha ocurrido un error inesperado. Inténtalo de nuevo más
            tarde.
          </p>
          {onRetry && (
            <Button className="mt-4" onClick={onRetry}>
              <RefreshCwIcon className="w-4 h-4" />
              Recargar
            </Button>
          )}
          {message && (
            <p className="mt-2 text-sm text-red-800 dark:text-red-400">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalError;
