"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { listCustomerBookings, listServices } from "@/api/customer.api";
import type { BookingListResponse } from "@/api/customer.api";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusChip from "@/components/admin/StatusChip";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import type { Booking, BookingStatus, Service } from "@/types/customer";

const STATUSES: Array<{ value: "" | BookingStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
];

export default function CustomerBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"" | BookingStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const response = await listServices();
      if (response?.status === 200 && response.data.data) {
        const services: Service[] = response.data.data;
        const map = services.reduce<Record<string, string>>(
          (acc, service) => ({ ...acc, [service.id]: service.name }),
          {},
        );
        setServiceMap(map);
      }
    }
    load();
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listCustomerBookings({
      page,
      limit: pageSize,
      status: statusFilter || undefined,
    });
    if (response?.status === 200 && response.data.data) {
      const data: BookingListResponse = response.data.data;
      setBookings(data.items);
      setTotal(data.total);
    } else {
      setError(response?.data?.message || "Failed to load bookings.");
    }
    setLoading(false);
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    async function load() {
      await fetchBookings();
    }
    load();
  }, [fetchBookings]);

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleString() : "Not scheduled";

  return (
    <CustomerDashboardShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          My Bookings
        </Typography>
        <Typography color="text.secondary">
          View and manage your booking history.
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | BookingStatus);
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s.label} value={s.value}>
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

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Booking</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Scheduled</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No bookings found.</Typography>
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => (
              <TableRow
                key={booking.id}
                hover
                onClick={() => router.push(`/customer/dashboard/bookings/${booking.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>#{booking.id.slice(0, 8)}</TableCell>
                <TableCell>
                  {booking.service?.name ?? serviceMap[booking.serviceId] ?? booking.serviceId}
                </TableCell>
                <TableCell>
                  <Chip label={booking.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{formatDate(booking.scheduledAt)}</TableCell>
                <TableCell>₵{booking.priceQuote.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusChip status={booking.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && bookings.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : (
        <AdminPagination
          page={page}
          totalPages={Math.ceil(total / pageSize)}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </CustomerDashboardShell>
  );
}
