'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useFormik } from "formik";
import * as Yup from "yup";

import { getMyProfile, updateMyProfile } from "@/api/provider.api";
import StatusChip from "@/components/admin/StatusChip";
import type { ProviderProfile } from "@/types/provider";

const validationSchema = Yup.object({
  bio: Yup.string().trim().max(1000, "Max 1000 characters").optional(),
  lat: Yup.number().min(-90, "Min -90").max(90, "Max 90").typeError("Must be a number").optional(),
  lng: Yup.number().min(-180, "Min -180").max(180, "Max 180").typeError("Must be a number").optional(),
  serviceAreaRadiusKm: Yup.number()
    .min(1, "Min 1")
    .max(100, "Max 100")
    .typeError("Must be a number")
    .optional(),
});

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getMyProfile();
    if (response?.status === 200 && response.data.data) {
      setProfile(response.data.data);
    } else {
      setError("Failed to load profile.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchProfile();
    }
    load();
  }, [fetchProfile]);

  const formik = useFormik({
    initialValues: {
      bio: profile?.bio ?? "",
      lat: profile?.lat ?? "",
      lng: profile?.lng ?? "",
      serviceAreaRadiusKm: profile?.serviceAreaRadiusKm ?? "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload: {
        bio?: string;
        lat?: number;
        lng?: number;
        serviceAreaRadiusKm?: number;
      } = {};

      if (values.bio?.trim()) payload.bio = values.bio.trim();
      if (values.lat !== "" && values.lat !== undefined) payload.lat = Number(values.lat);
      if (values.lng !== "" && values.lng !== undefined) payload.lng = Number(values.lng);
      if (values.serviceAreaRadiusKm !== "" && values.serviceAreaRadiusKm !== undefined) {
        payload.serviceAreaRadiusKm = Number(values.serviceAreaRadiusKm);
      }

      const response = await updateMyProfile(payload);

      if (response?.status === 200) {
        setSubmitSuccess("Profile updated successfully.");
        fetchProfile();
      } else {
        setSubmitError("Failed to update profile. Please try again.");
      }
      setSubmitting(false);
    },
  });

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

  if (!profile) {
    return <Alert severity="warning">Profile not found.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Profile
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Provider ID</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.id}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">User ID</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.userId}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <StatusChip status={profile.status} />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Verified</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={profile.verified ? "Yes" : "No"}
                  color={profile.verified ? "success" : "default"}
                  size="small"
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Average Rating</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {profile.avgRating.toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Reviews</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.totalReviews}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Jobs</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.totalJobs}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {(profile.completionRate * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Edit Profile
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
              {submitSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                name="bio"
                label="Bio"
                multiline
                rows={4}
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={formik.touched.bio && formik.errors.bio}
                fullWidth
              />
              <TextField
                name="lat"
                label="Latitude"
                type="number"
                value={formik.values.lat}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lat && Boolean(formik.errors.lat)}
                helperText={formik.touched.lat && formik.errors.lat}
                fullWidth
                slotProps={{ htmlInput: { min: -90, max: 90, step: "0.000001" } }}
              />
              <TextField
                name="lng"
                label="Longitude"
                type="number"
                value={formik.values.lng}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lng && Boolean(formik.errors.lng)}
                helperText={formik.touched.lng && formik.errors.lng}
                fullWidth
                slotProps={{ htmlInput: { min: -180, max: 180, step: "0.000001" } }}
              />
              <TextField
                name="serviceAreaRadiusKm"
                label="Service Area Radius (km)"
                type="number"
                value={formik.values.serviceAreaRadiusKm}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.serviceAreaRadiusKm && Boolean(formik.errors.serviceAreaRadiusKm)}
                helperText={formik.touched.serviceAreaRadiusKm && formik.errors.serviceAreaRadiusKm}
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: 100, step: "1" } }}
              />
              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
