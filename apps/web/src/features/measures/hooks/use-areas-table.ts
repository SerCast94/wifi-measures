import { useEffect, useMemo } from "react";

import { useQueryState, parseAsNumberLiteral, parseAsString } from "nuqs";

import type { Area } from "../types/areas.types";
import { sizeOptions } from "../constants/table";
import { sortMeasures } from "../lib/measures.helper";
import { useMeasuresStore } from "../store/measures.store";
import { parseAsPositiveInt } from "@/core/lib/parseAsPositiveInt";
import { useTableMeasuresStore } from "../store/table-measures.store";

export const useAreasTable = () => {
  const measures = useMeasuresStore((state) => state.measures);

  const measuresOrdered = useMemo(
    () => Object.values(measures).sort(sortMeasures),
    [measures]
  );

  // Ordenar por ID_AREA numérico
  const areasIds = measuresOrdered
    .map((measure) => Number(measure.metadata["ID_AREA"]))
    // Filter unique values
    .filter((value, index, self) => self.indexOf(value) === index)
    // Remove NaN values
    .filter((value) => !isNaN(value))
    // Sort ascending
    .sort((a, b) => a - b);

  const areas: Area[] = areasIds.map((id) => ({
    id,
    name: measuresOrdered.find(
      (measure) => Number(measure.metadata["ID_AREA"]) === id
    )?.metadata["AREA_GEOGR"] as string,
    provincia: measuresOrdered.find(
      (measure) => Number(measure.metadata["ID_AREA"]) === id
    )?.metadata["PROVINCIA"] as string,
    measures: measuresOrdered.filter(
      (measure) => Number(measure.metadata["ID_AREA"]) === id
    ),
  }));

  const [page, setPage] = useQueryState(
    "page",
    parseAsPositiveInt.withDefault(1)
  );

  const [size, setSize] = useQueryState(
    "size",
    parseAsNumberLiteral(sizeOptions).withDefault(sizeOptions[0])
  );

  const [filter, setFilter] = useQueryState("q", parseAsString.withDefault(""));

  const pagination = useTableMeasuresStore((state) => state.pagination);
  const setPagination = useTableMeasuresStore((state) => state.setPagination);

  const globalFilter = useTableMeasuresStore((state) => state.globalFilter);
  const setGlobalFilter = useTableMeasuresStore(
    (state) => state.setGlobalFilter
  );

  // Update pagination when page query param changes
  useEffect(() => {
    const pageIndex = Number(page) - 1;
    const pageSize = Number(size);
    // Check if the page is superior to the last page
    const lastPageIndex =
      Math.ceil(Object.entries(measures).length / pageSize) - 1;
    const currentPageIndex = lastPageIndex < 0 ? 0 : lastPageIndex;
    setPagination({
      pageIndex: pageIndex > currentPageIndex ? currentPageIndex : pageIndex,
      pageSize: pageSize,
    });
    setGlobalFilter(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update page query param when pagination changes
  useEffect(() => {
    setPage(pagination.pageIndex + 1);
    setSize(pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination]);

  // Si los envíos cambian, y la página actual no tiene envíos, entonces se
  // debe cambiar la página actual a la última página válida
  useEffect(() => {
    if (measures && Object.entries(measures).length > 0) {
      const { pageIndex, pageSize } = pagination;
      const lastPageIndex =
        Math.ceil(Object.entries(measures).length / pageSize) - 1;
      const paginatedData = Object.entries(measures).slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize
      );

      if (paginatedData.length === 0 && pageIndex > lastPageIndex) {
        setPagination({ pageIndex: lastPageIndex, pageSize });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measures]);

  // Update global filter when global
  useEffect(() => {
    setFilter(globalFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

  return {
    areas,
    pagination,
    setPagination,
  };
};
