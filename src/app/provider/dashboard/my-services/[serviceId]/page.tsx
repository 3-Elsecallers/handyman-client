'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMyProfile, updateService, removeService } from '@/api/provider.api';
import type { ProviderServiceEntry } from '@/types/provider';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const validationSchema = Yup.object({
  customPrice: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Price must be at least 0')
    .optional(),
});

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const [providerService, setProviderService] = useState<ProviderServiceEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyProfile();
      if (response?.status === 200 && response.data.data) {
        const profile = response.data.data;
        const found = profile.services.find(
          (s: ProviderServiceEntry) => String(s.id) === String(serviceId)
        );
        if (found) {
          setProviderService(found);
        } else {
          setError('Service not found in your profile.');
        }
      } else {
        setError('Failed to load service details.');
      }
    } catch {
      setError('Failed to load service details.');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    async function load() {
      await fetchProfile();
    }
    load();
  }, [fetchProfile]);

  const handleSubmit = async (values: {
    customPrice?: number | '';
    isActive: string;
  }) => {
    setSuccess(null);
    setError(null);
    try {
      const payload = {
        customPrice:
          values.customPrice !== '' && values.customPrice !== undefined
            ? Number(values.customPrice)
            : undefined,
        isActive: values.isActive === 'yes',
      };
      const response = await updateService(serviceId, payload);
      if (response?.status === 200) {
        setSuccess('Service updated successfully.');
        await fetchProfile();
      } else {
        setError('Failed to update service.');
      }
    } catch {
      setError('Failed to update service.');
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const response = await removeService(serviceId);
      if (response?.status === 200) {
        router.push('/provider/dashboard/my-services');
      } else {
        setError('Failed to remove service.');
        setRemoving(false);
        setRemoveDialogOpen(false);
      }
    } catch {
      setError('Failed to remove service.');
      setRemoving(false);
      setRemoveDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !providerService) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => router.push('/provider/dashboard/my-services')}
        >
          Back to My Services
        </Button>
      </Box>
    );
  }

  if (!providerService) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Service not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Service Details
      </Typography>

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {providerService.service?.name || 'Unknown Service'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Category: ${providerService.service?.category?.name ?? 'N/A'}`}
              variant="outlined"
            />
            <Chip
              label={`Base Price: $${providerService.service?.basePrice ?? 'N/A'}`}
              variant="outlined"
            />
            <Chip
              label={`Status: ${providerService.isActive ? 'Active' : 'Inactive'}`}
              color={providerService.isActive ? 'success' : 'default'}
            />
          </Box>

          <Typography variant="body1" color="text.secondary">
            Current Custom Price:{' '}
            <strong>
              {providerService.customPrice != null
                ? `$${providerService.customPrice}`
                : 'Not set'}
            </strong>
          </Typography>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Edit Service
          </Typography>

          <Formik
            initialValues={{
              customPrice: providerService.customPrice ?? '',
              isActive: providerService.isActive ? 'yes' : 'no',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, isSubmitting }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    name="customPrice"
                    label="Custom Price ($)"
                    type="number"
                    value={values.customPrice}
                    onChange={handleChange}
                    error={touched.customPrice && Boolean(errors.customPrice)}
                    helperText={touched.customPrice && errors.customPrice}
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="isActive-label">Active</InputLabel>
                    <Select
                      labelId="isActive-label"
                      name="isActive"
                      value={values.isActive}
                      onChange={handleChange}
                      label="Active"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setRemoveDialogOpen(true)}
                    >
                      Remove Service
                    </Button>
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeDialogOpen}
        title="Remove Service"
        description="Are you sure you want to remove this service from your profile? This action cannot be undone."
        onConfirm={handleRemove}
        onClose={() => {
          setRemoveDialogOpen(false);
          setRemoving(false);
        }}
        loading={removing}
      />
    </Box>
  );
}
