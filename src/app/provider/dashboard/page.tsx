'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import StarIcon from "@mui/icons-material/Star";
import WorkIcon from "@mui/icons-material/Work";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VerifiedIcon from "@mui/icons-material/Verified";

import { getDashboard } from "@/api/provider.api";
import { useAuth } from "@/contexts/AuthContext";
import type { DashboardStats } from "@/types/provider";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    async function load() {
      setLoading(true);
      setError(null);
      const response = await getDashboard();
      if (response?.status === 200 && response.data.data) {
        setData(response.data.data);
      } else {
        setError(response?.data?.message || "Failed to load dashboard.");
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                Account Status: {stats?.status ?? "unknown"}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

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
