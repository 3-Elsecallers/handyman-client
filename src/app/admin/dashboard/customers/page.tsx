'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getUsers } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { CustomerUser } from "@/types/admin";

const ROLE_FILTERS = ["", "customer", "provider", "admin"] as const;

export default function CustomersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getUsers({ page, limit: pageSize, search: search || undefined, role: roleFilter || undefined });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load users.");
    }
    setLoading(false);
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    async function load() { await fetchUsers(); }
    load();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
  };

  const columns: AdminTableColumn<CustomerUser>[] = [
    {
      label: "Name",
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    {
      label: "Role",
      render: (row) => (
        <Chip label={row.role} size="small" variant="outlined" />
      ),
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Customer Management
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          {ROLE_FILTERS.map((role) => (
            <Chip
              key={role || "all"}
              label={role || "All"}
              onClick={() => handleRoleFilterChange(role)}
              color={roleFilter === role ? "primary" : "default"}
              variant={roleFilter === role ? "filled" : "outlined"}
            />
          ))}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={users}
        loading={loading}
        emptyMessage="No users found."
        onRowClick={(row) => router.push(`/admin/dashboard/customers/${row.id}`)}
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
