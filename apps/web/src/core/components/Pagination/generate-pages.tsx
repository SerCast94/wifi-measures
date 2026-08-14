import { type JSX } from "react";

import {
  PaginationEllipsis,
  PaginationLink,
} from "@/core/atomic-components/pagination";

export const generatePaginationLinks = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  const pages: JSX.Element[] = [];
  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PaginationLink
          key={i}
          onClick={() => onPageChange(i)}
          isActive={i === currentPage}
        >
          {i}
        </PaginationLink>
      );
    }
  } else {
    for (let i = 1; i <= 2; i++) {
      pages.push(
        <PaginationLink
          key={i}
          onClick={() => onPageChange(i)}
          isActive={i === currentPage}
        >
          {i}
        </PaginationLink>
      );
    }
    if (2 < currentPage && currentPage < totalPages - 1) {
      pages.push(<PaginationEllipsis key={"ellipsis-1"} />);
      pages.push(
        <PaginationLink
          key={currentPage}
          onClick={() => onPageChange(currentPage)}
          isActive={true}
        >
          {currentPage}
        </PaginationLink>
      );
    }
    pages.push(<PaginationEllipsis key={"ellipsis-2"} />);
    for (let i = totalPages - 1; i <= totalPages; i++) {
      pages.push(
        <PaginationLink
          key={i}
          onClick={() => onPageChange(i)}
          isActive={i === currentPage}
        >
          {i}
        </PaginationLink>
      );
    }
  }
  return pages;
};
