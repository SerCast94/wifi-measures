interface PaginationStatsProps {
  rowsCount: number;
  selectedRowsCount: number;
  pageSize: number;
  pageIndex: number;
}

export const PaginationStats = ({
  rowsCount,
  selectedRowsCount,
  pageSize,
  pageIndex,
}: PaginationStatsProps) => {
  const from = pageSize * pageIndex + 1;
  const to = Math.min(pageSize * (pageIndex + 1), rowsCount);

  return (
    <div className="flex-1 text-sm text-muted-foreground">
      {selectedRowsCount
        ? `Seleccionadas ${selectedRowsCount} de `
        : `Mostrando de ${from} a ${to} de `}
      {rowsCount} fila(s)
    </div>
  );
};
