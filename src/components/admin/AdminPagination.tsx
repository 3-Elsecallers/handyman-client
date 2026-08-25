'use client';

import TablePagination from '@mui/material/TablePagination';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function AdminPagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page - 1}
      onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      rowsPerPage={pageSize}
      onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
      rowsPerPageOptions={[10, 20, 50]}
    />
  );
}
