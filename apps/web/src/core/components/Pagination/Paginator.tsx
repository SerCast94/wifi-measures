import {
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationNext,
} from "@/core/atomic-components/pagination";
import { generatePaginationLinks } from "./generate-pages";

type PaginatorProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  showPreviousNext: boolean;
};

export default function Paginator({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext,
}: PaginatorProps) {
  return (
    <Pagination>
      <PaginationContent>
        {showPreviousNext && totalPages ? (
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage - 1 < 1}
          />
        ) : null}
        {generatePaginationLinks(currentPage, totalPages, onPageChange)}
        {showPreviousNext && totalPages ? (
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage > totalPages - 1}
          />
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
