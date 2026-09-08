'use client';

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { listAdminAccounts } from "@/api/payment.api";
import type { LedgerAccount } from "@/api/payment.api";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/components/admin/AdminTable";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await listAdminAccounts();
      if (response?.status === 200 && response.data.data) {
        setAccounts(response.data.data);
      } else {
        setError(response?.data?.message || "Failed to load ledger accounts.");
      }
      setLoading(false);
    }
    load();
  }, []);

  const columns: AdminTableColumn<LedgerAccount>[] = [
    { label: "Type", key: "type" },
    {
      label: "Balance",
      render: (row) =>
        row.balance != null ? `GH₵ ${row.balance.toFixed(2)}` : "—",
    },
    {
      label: "Owner ID",
      render: (row) => row.ownerId || "—",
    },
    { label: "Currency", key: "currency" },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Ledger Accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All ledger accounts across the platform.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={accounts}
        loading={loading}
        emptyMessage="No accounts found."
        rowKey={(row) => row.id}
      />
    </Box>
  );
}
