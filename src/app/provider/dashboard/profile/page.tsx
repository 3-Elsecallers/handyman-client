'use client';

import { useCallback, useEffect, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
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
import {
  getMyUserProfile,
  requestAvatarUploadUrl,
  updateAvatar,
} from "@/api/customer.api";
import StatusChip from "@/components/admin/StatusChip";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import type { LocationSelection } from "@/lib/location";
import type { ProviderProfile } from "@/types/provider";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationSelection | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const userRes = await getMyUserProfile();
    if (userRes?.status === 200 && userRes.data.data) {
      setAvatarUrl(userRes.data.data.avatarUrl);
    }

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Invalid image type. Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be 5MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const urlRes = await requestAvatarUploadUrl({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      if (urlRes?.status !== 200 || !urlRes.data.data?.uploadUrl) {
        const message =
          typeof urlRes?.data === "object" && urlRes?.data && "message" in urlRes.data
            ? String((urlRes.data as { message: string }).message)
            : "Failed to prepare avatar upload.";
        setAvatarError(message);
        return;
      }

      const { uploadUrl } = urlRes.data.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      const publicUrl = uploadUrl.split("?")[0];

      const saveRes = await updateAvatar(publicUrl);
      if (saveRes?.status === 200 && saveRes.data.data?.avatarUrl) {
        setAvatarUrl(saveRes.data.data.avatarUrl);
        setAvatarSuccess("Profile photo updated successfully.");
      } else {
        setAvatarError("Photo uploaded but failed to save. Please try again.");
      }
    } catch {
      setAvatarError("An unexpected error occurred while uploading your photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

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

  const resolvedLocation: LocationSelection | null =
    location ??
    (typeof profile.lat === "number" && typeof profile.lng === "number"
      ? {
          formattedAddress: `Current coordinates (${profile.lat}, ${profile.lng})`,
          lat: profile.lat,
          lng: profile.lng,
        }
      : null);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Profile
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <Avatar
              src={avatarUrl ?? undefined}
              alt={user?.name ?? "Provider"}
              sx={{ width: 96, height: 96, fontSize: 40 }}
            />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              {profile.competencyTier && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    size="small"
                    label={`${profile.competencyTier} tier`}
                    color={profile.competencyTier === "master" ? "primary" : profile.competencyTier === "journeyman" ? "info" : "default"}
                  />
                  <Chip
                    size="small"
                    label={profile.qualityGrade}
                    color={profile.qualityGrade === "platinum" ? "primary" : profile.qualityGrade === "gold" ? "warning" : profile.qualityGrade === "silver" ? "secondary" : "default"}
                  />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Manage your profile photo. It is shown to admins and customers when they view your profile.
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading ? <CircularProgress size={18} /> : avatarUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {avatarUrl && !avatarUploading && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                )}
              </Box>
              {avatarError && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setAvatarError(null)}>
                  {avatarError}
                </Alert>
              )}
              {avatarSuccess && (
                <Alert severity="success" sx={{ mt: 1 }} onClose={() => setAvatarSuccess(null)}>
                  {avatarSuccess}
                </Alert>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            </Box>
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
              <LocationAutocomplete
                value={resolvedLocation}
                onChange={(value) => {
                  setLocation(value);
                  formik.setFieldValue("lat", value ? value.lat : "", true);
                  formik.setFieldValue("lng", value ? value.lng : "", true);
                }}
                label="Service location"
                hint="Select your base location. Latitude/longitude are saved with your profile for job matching."
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
