'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { buildServiceNameMap, listAllBookings } from "@/api/booking.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusChip from "@/components/admin/StatusChip";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { Booking, BookingStatus } from "@/types/customer";

const STATUSES: { label: string; value: BookingStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Disputed", value: "disputed" },
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAllBookings({
      status: status || undefined,
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
    });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setBookings(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } else {
      setError(response?.data?.message || "Failed to load bookings.");
    }
    setLoading(false);
  }, [status, debouncedSearch, page, pageSize]);

  useEffect(() => {
    async function load() {
      const nameMap = await buildServiceNameMap();
      setServiceMap(nameMap);
    }
    load();
  }, []);

  useEffect(() => {
    async function load() { await fetchBookings(); }
    load();
  }, [fetchBookings]);

  const columns: AdminTableColumn<Booking>[] = [
    {
      label: "Service",
      render: (row) =>
        serviceMap[row.serviceId] || row.service?.name || row.serviceId,
    },
    { label: "Type", key: "type" },
    {
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      label: "Scheduled",
      render: (row) =>
        row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—",
    },
    {
      label: "Price",
      render: (row) => `GH₵ ${row.priceQuote.toFixed(2)}`,
    },
    { label: "Customer ID", key: "customerId" },
    {
      label: "Reassigned?",
      render: (row) => (row.reassignCount > 0 ? "Yes" : "No"),
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Bookings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All bookings across the platform.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookingStatus | "");
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
        <TextField
          size="small"
          placeholder="Search by location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={bookings}
        loading={loading}
        emptyMessage="No bookings found."
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/dashboard/bookings/${row.id}`)}
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
