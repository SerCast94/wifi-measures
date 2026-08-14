import { Card, CardContent } from "@/core/atomic-components/card";

import underConstruction from "@/assets/images/under-construction.svg";

interface UnderConstructionProps {
  message?: string;
}

const UnderConstruction = ({ message }: UnderConstructionProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh_-_80px)] p-6">
      <Card className="max-w-xl p-6 text-center bg-white shadow-xl dark:bg-gray-800 rounded-2xl animate-fade-in">
        <img
          src={underConstruction}
          alt="Under Construction"
          className="w-64 mx-auto animate-pulse"
        />
        <CardContent className="mt-6">
          <h1 className="text-2xl font-bold text-foreground">
            Página en Construcción
          </h1>
          <p className="mt-2 text-sm">
            Estamos trabajando en algo increíble. Vuelve pronto.
          </p>
          {message && (
            <p className="mt-6 text-sm font-bold text-primary">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderConstruction;
