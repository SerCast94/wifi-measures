import React, { useEffect, useMemo } from "react";

import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

import type { Area } from "../types/areas.types";
import { sortMeasures } from "../lib/measures.helper";
import { useMeasuresStore } from "../store/measures.store";
import CustomLoading from "@/core/components/CustomLoading";

const withArea = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: React.ComponentProps<typeof WrappedComponent>) => {
    const navigate = useNavigate();
    const { areaId } = useParams<{ areaId: string }>();
    const measures = useMeasuresStore((state) => state.measures);

    const measuresOrdered = useMemo(
      () => Object.values(measures).sort(sortMeasures),
      [measures]
    );

    const currentArea: Area | null = areaId
      ? {
          id: +areaId,
          name: measuresOrdered.find(
            (measure) => Number(measure.metadata["ID_AREA"]) === +areaId
          )?.metadata["AREA_GEOGR"] as string,
          provincia: measuresOrdered.find(
            (measure) => Number(measure.metadata["ID_AREA"]) === +areaId
          )?.metadata["PROVINCIA"] as string,
          measures: measuresOrdered.filter(
            (measure) => Number(measure.metadata["ID_AREA"]) === +areaId
          ),
        }
      : null;

    useEffect(() => {
      if (!currentArea) {
        toast.error("No se encontró el área solicitada.");
        navigate("/areas");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!currentArea) {
      return <CustomLoading />;
    }

    return <WrappedComponent {...props} area={currentArea} />;
  };
};

export default withArea;
