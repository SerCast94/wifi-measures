import React, { useEffect } from "react";

import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

import { useMeasuresStore } from "../store/measures.store";
import CustomLoading from "@/core/components/CustomLoading";

const withMeasure = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: React.ComponentProps<typeof WrappedComponent>) => {
    const navigate = useNavigate();
    const { measureId } = useParams<{ measureId: string }>();
    const measures = useMeasuresStore((state) => state.measures);
    const currentMeasure = measures[measureId || ""];

    useEffect(() => {
      if (!currentMeasure) {
        toast.error("No se encontró la medida solicitada.");
        navigate("/home");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!currentMeasure) {
      return <CustomLoading />;
    }

    return <WrappedComponent {...props} measure={currentMeasure} />;
  };
};

export default withMeasure;
