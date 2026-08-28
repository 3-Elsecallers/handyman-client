"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { listCustomerBookings } from "@/api/customer.api";
import type { BookingListResponse } from "@/api/customer.api";
import StatusChip from "@/components/admin/StatusChip";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import type { Booking } from "@/types/customer";

const QUICK_ACTIONS = [
  { label: "New Booking", description: "Create a new service booking", href: "/customer/dashboard/new-booking", icon: <AddCircleIcon fontSize="large" color="primary" /> },
  { label: "Browse Services", description: "Explore our service catalog", href: "/customer/dashboard/services", icon: <StorefrontIcon fontSize="large" color="primary" /> },
  { label: "My Bookings", description: "View booking history", href: "/customer/dashboard/bookings", icon: <BookOnlineIcon fontSize="large" color="primary" /> },
  { label: "Addresses", description: "Manage your saved addresses", href: "/customer/dashboard/addresses", icon: <LocationOnIcon fontSize="large" color="primary" /> },
];

export default function CustomerDashboardHomePage() {
  const router = useRouter();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listCustomerBookings({ page: 1, limit: 5 });
    if (response?.status === 200 && response.data.data) {
      const data: BookingListResponse = response.data.data;
      setRecentBookings(data.items);
      setTotalBookings(data.total);
      setCompletedCount(
        data.items.filter((b) => b.status === "completed").length,
      );
    } else {
      setError(response?.data?.message || "Failed to load bookings.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchBookings();
    }
    load();
  }, [fetchBookings]);

  return (
    <CustomerDashboardShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Customer Dashboard
        </Typography>
        <Typography color="text.secondary">
          Manage your bookings, services and addresses all in one place.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loading ? "—" : totalBookings}
              </Typography>
              <Typography color="text.secondary">Total Bookings</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loading ? "—" : completedCount}
              </Typography>
              <Typography color="text.secondary">Recent Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {QUICK_ACTIONS.map((action) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.href}>
              <Card variant="outlined">
                <CardActionArea component={Link} href={action.href}>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      {action.icon}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {action.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Bookings
          </Typography>
          <Button component={Link} href="/customer/dashboard/bookings">
            View all
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : recentBookings.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              No bookings yet. Create your first booking to get started.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {recentBookings.map((booking) => (
              <Paper
                key={booking.id}
                variant="outlined"
                sx={{ p: 2, cursor: "pointer" }}
                onClick={() => router.push(`/customer/dashboard/bookings/${booking.id}`)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Booking #{booking.id.slice(0, 8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.scheduledAt
                        ? new Date(booking.scheduledAt).toLocaleString()
                        : "Not scheduled"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StatusChip status={booking.status} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      ₵{booking.priceQuote.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </CustomerDashboardShell>
  );
}
