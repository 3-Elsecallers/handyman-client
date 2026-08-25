'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Divider,
} from '@mui/material';

import { getMyProfile, addBlockedSlot } from '@/api/provider.api';
import type { ProviderProfile } from '@/types/provider';

const validationSchema = Yup.object({
  startAt: Yup.string().required('Start date/time is required'),
  endAt: Yup.string().required('End date/time is required'),
  reason: Yup.string().max(200, 'Reason must be 200 characters or less').optional(),
}).test(
  'start-before-end',
  'Start must be before end',
  (values) => {
    if (!values.startAt || !values.endAt) return true;
    return new Date(values.startAt) < new Date(values.endAt);
  },
);

export default function BlockedSlotsPage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const response = await getMyProfile();
      if (response?.status === 200 && response.data.data) {
        setProfile(response.data.data);
      } else {
        setError(response?.data?.message || 'Failed to load profile.');
      }
      setLoading(false);
    })();
  }, []);

  const formik = useFormik({
    initialValues: {
      startAt: '',
      endAt: '',
      reason: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError(null);
      setSuccess(null);
      const response = await addBlockedSlot({
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        reason: values.reason || undefined,
      });
      if (response?.status === 201) {
        setSuccess('Blocked slot added successfully.');
        resetForm();
      } else {
        setError(response?.data?.message || 'Failed to add blocked slot.');
      }
      setSubmitting(false);
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Blocked Slots
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Block time periods when you are unavailable for bookings.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        The current API does not support listing existing blocked slots. You can add new blocked
        slots using the form below, but they will not appear in a list on this page.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Blocked Slot
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="startAt"
              label="Start Date & Time"
              type="datetime-local"
              value={formik.values.startAt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.startAt && Boolean(formik.errors.startAt)}
              helperText={formik.touched.startAt && formik.errors.startAt}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              name="endAt"
              label="End Date & Time"
              type="datetime-local"
              value={formik.values.endAt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.endAt && Boolean(formik.errors.endAt)}
              helperText={formik.touched.endAt && formik.errors.endAt}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              name="reason"
              label="Reason (optional)"
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.reason && Boolean(formik.errors.reason)}
              helperText={formik.touched.reason && formik.errors.reason}
              fullWidth
              multiline
              rows={2}
            />

            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Add Blocked Slot'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
