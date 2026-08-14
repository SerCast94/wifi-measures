import { useCallback, useEffect } from "react";

import L, { Map } from "leaflet";

import { useMeasuresStore } from "@/features/measures/store/measures.store";

export const useMeasures = (map: Map) => {
  const measures = useMeasuresStore((state) => state.measures);
  const filteredMeasuresIds = useMeasuresStore((state) => state.measuresIds);
  const setGlobalFilter = useMeasuresStore((state) => state.setGlobalFilter);

  // Función para ajustar el mapa a las medidas filtradas
  const fitBounds = useCallback(() => {
    if (!filteredMeasuresIds || filteredMeasuresIds.length === 0) return;
    const filteredMeasures = filteredMeasuresIds.map((id) => measures[id]);
    const bounds = L.latLngBounds(
      filteredMeasures.map((measure) => measure.latLng)
    );
    map.flyToBounds(bounds, { padding: [50, 50], duration: 0.3 });
  }, [measures, filteredMeasuresIds, map]);

  // Se ajusta el filtro global al cambiar las medidas
  useEffect(() => {
    if (!measures) return;
    setGlobalFilter("");
  }, [measures, setGlobalFilter]);

  // Se ajusta el mapa a los medidas filtrados al cambiar los medidas filtrados
  useEffect(() => {
    if (!filteredMeasuresIds) return;
    if (filteredMeasuresIds && filteredMeasuresIds.length > 0) {
      fitBounds();
    }
  }, [filteredMeasuresIds, fitBounds]);

  return {
    fitBounds,
  };
};
