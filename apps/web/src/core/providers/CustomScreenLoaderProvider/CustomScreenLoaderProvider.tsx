import React, { createContext, useContext, useState } from "react";

interface LoaderContextType {
  isLoading: boolean;
  message: string;
  showLoader: (message: string) => void;
  hideLoader: () => void;
}

// Creamos el contexto del Loader
const LoaderContext = createContext<LoaderContextType>({} as LoaderContextType);

// El Provider que manejará el estado del loader
export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Cargando...");

  // Funciones para mostrar y ocultar el loader
  const showLoader = (message: string) => {
    setMessage(message);
    setIsLoading(true);
  };
  const hideLoader = () => {
    setIsLoading(false);
    setMessage("Cargando...");
  };

  return (
    <LoaderContext.Provider
      value={{ isLoading, showLoader, hideLoader, message }}
    >
      {children}
    </LoaderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLoader = () => {
  if (!LoaderContext) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return useContext(LoaderContext);
};
