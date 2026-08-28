'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getAllProviders } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusChip from "@/components/admin/StatusChip";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { ProviderProfile } from "@/types/admin";

const STATUS_FILTERS = ["", "pending_review", "active", "suspended", "deactivated"] as const;
const VERIFICATION_FILTERS = ["", "not_submitted", "pending_review", "approved", "rejected"] as const;

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verificationFilter, setVerificationFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getAllProviders({
      page,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      verificationStatus: verificationFilter || undefined,
    });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setProviders(data.providers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load providers.");
    }
    setLoading(false);
  }, [page, pageSize, search, statusFilter, verificationFilter]);

  useEffect(() => {
    async function load() { await fetchProviders(); }
    load();
  }, [fetchProviders]);

  const columns: AdminTableColumn<ProviderProfile>[] = [
    {
      label: "Provider",
      render: (row) => (
        <Box>
          <Typography variant="body2">
            {row.user ? `${row.user.firstName} ${row.user.lastName}` : row.userId.slice(0, 8) + "..."}
          </Typography>
          {row.user && (
            <Typography variant="caption" color="text.secondary">
              {row.user.email}
            </Typography>
          )}
          {!row.user && row.bio && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: "block" }}>
              {row.bio}
            </Typography>
          )}
        </Box>
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
      label: "Verification",
      render: (row) => <StatusChip status={row.verificationStatus} />,
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Management
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search providers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 240 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {STATUS_FILTERS.filter(Boolean).map((status) => (
            <MenuItem key={status} value={status}>
              {status.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Verification"
          value={verificationFilter}
          onChange={(e) => {
            setVerificationFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Verification</MenuItem>
          {VERIFICATION_FILTERS.filter(Boolean).map((vs) => (
            <MenuItem key={vs} value={vs}>
              {vs.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={providers}
        loading={loading}
        emptyMessage="No providers found."
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
