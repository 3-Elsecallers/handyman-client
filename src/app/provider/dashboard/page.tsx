'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import StarIcon from "@mui/icons-material/Star";
import WorkIcon from "@mui/icons-material/Work";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VerifiedIcon from "@mui/icons-material/Verified";

import { useRouter } from "next/navigation";

import { getDashboard, getMyRequirements } from "@/api/provider.api";
import { buildServiceNameMap, listProviderBookings } from "@/api/booking.api";
import { useAuth } from "@/contexts/AuthContext";
import StatusChip from "@/components/admin/StatusChip";
import type { DashboardStats } from "@/types/provider";
import type { Booking, BookingStatus } from "@/types/customer";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [requirementsComplete, setRequirementsComplete] = useState<number | null>(null);
  const [requirementsTotal, setRequirementsTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    async function load() {
      setLoading(true);
      setError(null);
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        getDashboard(),
        listProviderBookings({ page: 1, limit: 10 }),
      ]);
      if (dashboardResponse?.status === 200 && dashboardResponse.data.data) {
        setData(dashboardResponse.data.data);
      } else {
        setError(dashboardResponse?.data?.message || "Failed to load dashboard.");
      }
      if (bookingsResponse?.status === 200 && bookingsResponse.data.data) {
        const bookingData = bookingsResponse.data.data;
        setBookings(bookingData.items);
        setBookingTotal(bookingData.total);
      }
      const reqsResponse = await getMyRequirements();
      if (reqsResponse?.status === 200 && reqsResponse.data.data) {
        const reqs = reqsResponse.data.data.requirements;
        const required = reqs.filter((r: { isRequired: boolean }) => r.isRequired);
        const completed = required.filter((r: { submissionStatus: string | null }) => r.submissionStatus === "approved" || r.submissionStatus === "submitted");
        setRequirementsTotal(required.length);
        setRequirementsComplete(completed.length);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    async function load() {
      const nameMap = await buildServiceNameMap();
      setServiceMap(nameMap);
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const stats = data?.stats;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.name}.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 4 }}>
        <Card variant="outlined">
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <StarIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.avgRating.toFixed(1) ?? "0.0"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Rating ({stats?.totalReviews ?? 0} reviews)
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <WorkIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.totalJobs ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs Completed
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ThumbUpIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats ? `${(stats.completionRate * 100).toFixed(0)}%` : "100%"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <VerifiedIcon sx={{ fontSize: 40, color: stats?.verified ? "success.main" : "text.disabled" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats?.verified ? "Verified" : "Not Verified"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Account Status: {stats?.status.split("_").join(" ").toUpperCase() ?? "Unknown"}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {requirementsTotal !== null && requirementsTotal > 0 && (
        <Card
          variant="outlined"
          sx={{ mb: 4, cursor: "pointer" }}
          onClick={() => router.push("/provider/dashboard/requirements")}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Verification Requirements
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {requirementsComplete} of {requirementsTotal} required items completed
              </Typography>
            </Box>
            <Button size="small" variant="outlined">
              {requirementsComplete === requirementsTotal ? "View" : "Complete Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bookings
        </Typography>
        <Button size="small" onClick={() => router.push("/provider/dashboard/bookings")}>
          View all ({bookingTotal})
        </Button>
      </Box>
      {bookings.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No bookings yet.
        </Alert>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2, mb: 4 }}>
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => router.push(`/provider/dashboard/bookings/${booking.id}`)}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {serviceMap[booking.serviceId] || booking.service?.name || booking.serviceId}
                  </Typography>
                  <StatusChip status={booking.status as BookingStatus} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {booking.scheduledAt
                    ? new Date(booking.scheduledAt).toLocaleString()
                    : "Unscheduled"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  GH₵ {booking.priceQuote.toFixed(2)} · {booking.type} · {booking.complexity}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {data?.recentReviews && data.recentReviews.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Recent Reviews
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {data.recentReviews.map((review) => (
            <Card key={review.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {review.comment && (
                  <Typography variant="body2" color="text.secondary">
                    {review.comment}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
