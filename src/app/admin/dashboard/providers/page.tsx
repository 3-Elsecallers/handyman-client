'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { getVerificationQueue } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusChip from "@/components/admin/StatusChip";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { ProviderProfile } from "@/types/admin";

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getVerificationQueue({ page, limit: pageSize });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setProviders(data.providers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load verification queue.");
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    async function load() { await fetchProviders(); }
    load();
  }, [fetchProviders]);

  const columns: AdminTableColumn<ProviderProfile>[] = [
    { label: "Provider ID", key: "id" },
    {
      label: "Bio",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 200, display: "block" }}>
          {row.bio || "—"}
        </Typography>
      ),
    },
    {
      label: "Rating",
      render: (row) => row.avgRating.toFixed(1),
    },
    { label: "Jobs", key: "totalJobs" },
    {
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Providers pending review appear below. Click a row to view details and approve or reject.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={providers}
        loading={loading}
        emptyMessage="No providers in the verification queue."
        onRowClick={(row) => router.push(`/admin/dashboard/providers/${row.id}`)}
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
