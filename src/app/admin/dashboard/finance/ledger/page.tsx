'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { listAdminLedger } from "@/api/payment.api";
import type { LedgerEntry } from "@/api/payment.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTableColumn } from "@/components/admin/AdminTable";

const REF_TYPES: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Payment Allocated", value: "payment_allocated" },
  { label: "Platform Fee", value: "platform_fee" },
  { label: "Cash Fee", value: "cash_fee" },
  { label: "Hold", value: "hold" },
  { label: "Release", value: "release" },
  { label: "Tip", value: "tip" },
  { label: "Payout", value: "payout" },
  { label: "Refund", value: "refund" },
];

const PAGE_SIZE = 10;

export default function LedgerPage() {
  const [items, setItems] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [refType, setRefType] = useState("");
  const [providerId, setProviderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAdminLedger({
      refType: refType || undefined,
      providerId: providerId || undefined,
      page,
      limit: pageSize,
    });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load ledger entries.");
    }
    setLoading(false);
  }, [refType, providerId, page, pageSize]);

  useEffect(() => {
    async function load() { await fetchLedger(); }
    load();
  }, [fetchLedger]);

  const columns: AdminTableColumn<LedgerEntry>[] = [
    {
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      label: "Type",
      render: (row) => (
        <Chip
          label={row.type.replace(/_/g, " ")}
          size="small"
          color="default"
        />
      ),
    },
    {
      label: "Account ID",
      render: (row) => (
        <Typography component="span" sx={{ fontFamily: "monospace", fontSize: 13 }}>
          {row.accountId.length > 14 ? `${row.accountId.slice(0, 14)}…` : row.accountId}
        </Typography>
      ),
    },
    {
      label: "Counterparty",
      render: (row) => row.counterpartyId || "—",
    },
    {
      label: "Credit",
      render: (row) => (row.credit > 0 ? `GH₵ ${row.credit.toFixed(2)}` : "—"),
    },
    {
      label: "Debit",
      render: (row) => (row.debit > 0 ? `GH₵ ${row.debit.toFixed(2)}` : "—"),
    },
    {
      label: "Ref",
      render: (row) =>
        row.refType && row.refId
          ? `${row.refType}/${row.refId}`
          : "—",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Ledger
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Platform ledger entries.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Ref Type</InputLabel>
          <Select
            label="Ref Type"
            value={refType}
            onChange={(e) => {
              setRefType(e.target.value);
              setPage(1);
            }}
          >
            {REF_TYPES.map((t) => (
              <MenuItem key={t.value || "all"} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Provider ID"
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 220 }}
        />
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
        emptyMessage="No ledger entries found."
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
