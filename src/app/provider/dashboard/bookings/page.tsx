'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import { buildServiceNameMap, listProviderBookings } from "@/api/booking.api";
import StatusChip from "@/components/admin/StatusChip";
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

function formatSchedule(booking: Booking) {
  if (booking.scheduledAt) {
    const date = new Date(booking.scheduledAt).toLocaleDateString();
    if (booking.scheduledWindowEnd) {
      return `${date} (${new Date(booking.scheduledAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${new Date(booking.scheduledWindowEnd).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })})`;
    }
    return new Date(booking.scheduledAt).toLocaleString();
  }
  return "Unscheduled";
}

export default function ProviderBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listProviderBookings({
      status: status || undefined,
      page,
      limit: pageSize,
    });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setBookings(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } else {
      setError(response?.data?.message || "Failed to load bookings.");
    }
    setLoading(false);
  }, [status, page, pageSize]);

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

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > pages) return;
    setPage(newPage);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          My Bookings
        </Typography>
      </Box>

      <FormControl size="small" sx={{ minWidth: 200, mb: 3 }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Alert severity="info">No bookings found.</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => router.push(`/provider/dashboard/bookings/${booking.id}`)}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {serviceMap[booking.serviceId] || booking.service?.name || booking.serviceId}
                  </Typography>
                  <StatusChip status={booking.status} />
                </Box>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Typography variant="body2" color="text.secondary">
                    Type: {booking.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled: {formatSchedule(booking)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: GH₵ {booking.priceQuote.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complexity: {booking.complexity}
                  </Typography>
                </Box>
                <Chip
                  label={`ID: ${booking.id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, fontFamily: "monospace", fontSize: "0.75rem" }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {!loading && pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
          <Button onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <Typography variant="body2" color="text.secondary">
            Page {page} of {pages} ({total} bookings)
          </Typography>
          <Button onClick={() => goToPage(page + 1)} disabled={page >= pages}>
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
