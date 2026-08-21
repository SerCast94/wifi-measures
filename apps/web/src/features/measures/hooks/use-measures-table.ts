import { useEffect, useMemo } from "react";

import {
  useQueryState,
  parseAsNumberLiteral,
  parseAsString,
  parseAsBoolean,
} from "nuqs";

import { sizeOptions } from "../constants/table";
import { sortMeasures } from "../lib/measures.helper";
import { useMeasuresStore } from "../store/measures.store";
import { parseAsPositiveInt } from "@/core/lib/parseAsPositiveInt";
import { useTableMeasuresStore } from "../store/table-measures.store";

export const MEASURE_COLORS = ["red", "yellow", "green", "black"] as const;

export const useMeasuresTable = () => {
  const measures = useMeasuresStore((state) => state.measures);
  const [page, setPage] = useQueryState(
    "page",
    parseAsPositiveInt.withDefault(1)
  );

  const [size, setSize] = useQueryState(
    "size",
    parseAsNumberLiteral(sizeOptions).withDefault(sizeOptions[0])
  );

  const [filter, setFilter] = useQueryState("q", parseAsString.withDefault(""));

  const [color, setColor] = useQueryState(
    "color",
    parseAsString.withDefault("")
  );

  const [failed, setFailed] = useQueryState(
    "failed",
    parseAsBoolean.withDefault(false)
  );

  const pagination = useTableMeasuresStore((state) => state.pagination);
  const setPagination = useTableMeasuresStore((state) => state.setPagination);

  const measuresOrdered = useMemo(
    () => Object.values(measures).sort(sortMeasures),
    [measures]
  );

  const measuresFiltered = useMemo(() => {
    let list = measuresOrdered;
    if (color) {
      list = list.filter(
        (measure) =>
          (measure.raw as Record<string, unknown> | undefined)?.overallColor ===
          color
      );
    }
    if (failed) {
      list = list.filter((measure) => {
        const raw = measure.raw as Record<string, unknown> | undefined;
        if (!raw) return false;
        const failures = [
          ...((raw.failureReasons ?? []) as unknown[]),
          ...((raw.linkFailureReasons ?? []) as unknown[]),
        ];
        return failures.length > 0;
      });
    }
    return list;
  }, [measuresOrdered, color, failed]);

  const clearFilters = () => {
    setColor("");
    setFailed(false);
  };

  const hasActiveFilters = Boolean(color) || failed;

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
    measuresOrdered: measuresFiltered,
    pagination,
    setPagination,
    color,
    setColor,
    failed,
    setFailed,
    clearFilters,
    hasActiveFilters,
  };
};
