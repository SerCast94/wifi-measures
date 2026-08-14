import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getMeasures } from "../api/get-measures";
import { useMeasuresStore } from "../store/measures.store";
import CustomLoading from "@/core/components/CustomLoading";
import InternalError from "@/core/components/InternalError";
import type { MeasureModel } from "../models/measure.model";

export const MeasuresProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const setMeasures = useMeasuresStore((state) => state.setMeasures);

  const {
    data: measures,
    isLoading,
    isError,
    refetch,
    isSuccess,
  } = useQuery<unknown, Error, MeasureModel[]>({
    queryKey: [QUERY_KEYS.measures],
    queryFn: getMeasures,
    retry: false,
    //  5 minutes in development, 2 hour in production
    staleTime:
      process.env.NODE_ENV === "development" ? 1000 * 60 * 5 : 1000 * 60 * 120,
  });

  useEffect(() => {
    if (isSuccess && measures) {
      setMeasures(measures);
    }
  }, [isSuccess, measures, setMeasures]);

  if (isLoading) {
    return <CustomLoading />;
  }

  if (isError) {
    return (
      <InternalError message="Error al cargar las medidas" onRetry={refetch} />
    );
  }

  return children;
};
