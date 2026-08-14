import { useEffect, useMemo } from "react";

import { useQueryState, parseAsNumberLiteral, parseAsString } from "nuqs";

import { sizeOptions } from "../constants/table";
import { useUsers } from "../providers/UsersProvider";
import { useTableUsersStore } from "../store/table-users.store";
import { parseAsPositiveInt } from "@/core/lib/parseAsPositiveInt";

export const useUsersTable = () => {
  const { users } = useUsers();
  const [page, setPage] = useQueryState(
    "page",
    parseAsPositiveInt.withDefault(1)
  );

  const [size, setSize] = useQueryState(
    "size",
    parseAsNumberLiteral(sizeOptions).withDefault(sizeOptions[0])
  );

  const [filter, setFilter] = useQueryState("q", parseAsString.withDefault(""));

  const pagination = useTableUsersStore((state) => state.pagination);
  const setPagination = useTableUsersStore((state) => state.setPagination);

  const rowSelection = useTableUsersStore((state) => state.selectedRowsState);
  const setSelectedIds = useTableUsersStore((state) => state.setSelectedIds);

  const usersOrdered = useMemo(
    () => users.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
    [users]
  );

  const globalFilter = useTableUsersStore((state) => state.globalFilter);
  const setGlobalFilter = useTableUsersStore((state) => state.setGlobalFilter);

  // Update pagination when page query param changes
  useEffect(() => {
    const pageIndex = Number(page) - 1;
    const pageSize = Number(size);
    // Check if the page is superior to the last page
    const lastPageIndex = Math.ceil(users.length / pageSize) - 1;
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

  // Update selectedIds when rowSelection changes
  useEffect(() => {
    const selectedIds = users
      .filter((_, index) =>
        Object.keys(rowSelection).includes(index.toString())
      )
      .map((user) => user.id);
    setSelectedIds(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // Si los envíos cambian, y la página actual no tiene envíos, entonces se
  // debe cambiar la página actual a la última página válida
  useEffect(() => {
    if (users && users.length > 0) {
      const { pageIndex, pageSize } = pagination;
      const lastPageIndex = Math.ceil(users.length / pageSize) - 1;
      const paginatedData = users.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize
      );

      if (paginatedData.length === 0 && pageIndex > lastPageIndex) {
        setPagination({ pageIndex: lastPageIndex, pageSize });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // Update global filter when global
  useEffect(() => {
    setFilter(globalFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

  return {
    usersOrdered,
    pagination,
    setPagination,
  };
};
