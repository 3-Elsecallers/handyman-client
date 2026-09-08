'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import { listAdminWithdrawals } from "@/api/payment.api";
import type { PayoutRequest, PayoutRequestStatus } from "@/api/payment.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTableColumn } from "@/components/admin/AdminTable";

const STATUSES: { label: string; value: PayoutRequestStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Processed", value: "processed" },
  { label: "Failed", value: "failed" },
  { label: "Reversed", value: "reversed" },
];

const STATUS_COLOR: Record<
  string,
  "warning" | "info" | "success" | "error" | "default"
> = {
  pending: "warning",
  processing: "info",
  processed: "success",
  failed: "error",
  reversed: "default",
};

const PAGE_SIZE = 10;

export default function WithdrawalsPage() {
  const [items, setItems] = useState<PayoutRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<PayoutRequestStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAdminWithdrawals({
      status: status || undefined,
      page,
      limit: pageSize,
    });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load withdrawal requests.");
    }
    setLoading(false);
  }, [status, page, pageSize]);

  useEffect(() => {
    async function load() { await fetchWithdrawals(); }
    load();
  }, [fetchWithdrawals]);

  const columns: AdminTableColumn<PayoutRequest>[] = [
    {
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      label: "Provider ID",
      render: (row) => (
        <Typography component="span" sx={{ fontFamily: "monospace", fontSize: 13 }}>
          {row.providerId.length > 14 ? `${row.providerId.slice(0, 14)}…` : row.providerId}
        </Typography>
      ),
    },
    {
      label: "Amount",
      render: (row) => `GH₵ ${row.amount.toFixed(2)}`,
    },
    {
      label: "Fee",
      render: (row) => `GH₵ ${row.fee.toFixed(2)}`,
    },
    {
      label: "Net Amount",
      render: (row) => `GH₵ ${row.netAmount.toFixed(2)}`,
    },
    {
      label: "Medium",
      render: (row) => row.medium.replace(/_/g, " "),
    },
    {
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={STATUS_COLOR[row.status] ?? "default"}
        />
      ),
    },
    {
      label: "Paystack Ref",
      render: (row) => row.paystackRef || "—",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Withdrawals
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provider withdrawal requests.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PayoutRequestStatus | "");
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s.value || "all"} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyMessage="No withdrawal requests found."
        rowKey={(row) => row.id}
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Box>
  );
}
