'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { getMyProfile, getReviewsForProvider, respondToReview } from '@/api/provider.api';
import type { ProviderProfile, PaginatedReviews } from '@/types/provider';
import AdminPagination from '@/components/admin/AdminPagination';

const validationSchema = Yup.object({
  response: Yup.string()
    .min(1, 'Response cannot be empty')
    .max(2000, 'Response must be 2000 characters or less')
    .required('Response is required'),
});

export default function ProviderReviewsPage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviewsData, setReviewsData] = useState<PaginatedReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = useCallback(
    async (providerId: string, currentPage: number, currentLimit: number) => {
      try {
        const response = await getReviewsForProvider(providerId, currentPage, currentLimit);
        if (response?.status === 200 && response.data.data) {
          setReviewsData(response.data.data);
        } else {
          setError('Failed to load reviews.');
        }
      } catch {
        setError('Failed to load reviews.');
      }
    },
    []
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await getMyProfile();
        if (response?.status === 200 && response.data.data) {
          setProfile(response.data.data);
        } else {
          setError('Failed to load profile.');
        }
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const pid = profile.id;
    async function load() {
      setLoading(true);
      await fetchReviews(pid, page, pageSize);
      setLoading(false);
    }
    load();
  }, [page, profile, pageSize, fetchReviews]);

  const handleOpenRespond = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setRespondDialogOpen(true);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleCloseRespond = () => {
    setRespondDialogOpen(false);
    setSelectedReviewId(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmitResponse = async (values: { response: string }) => {
    if (!selectedReviewId) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await respondToReview(selectedReviewId, values.response);
      setSubmitSuccess(true);
      handleCloseRespond();
      if (profile) {
        await fetchReviews(profile.id, page, pageSize);
      }
    } catch {
      setSubmitError('Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars.join('');
  };

  if (loading && !reviewsData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reviews
      </Typography>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(false)}>
          Response submitted successfully.
        </Alert>
      )}

      {reviewsData?.reviews.length === 0 && (
        <Alert severity="info">No reviews yet.</Alert>
      )}

      {reviewsData?.reviews.map((review) => (
        <Card key={review.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="span">
                {renderStars(review.rating)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(review.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Typography variant="body1" gutterBottom>
              {review.comment}
            </Typography>

            {review.providerResponse && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Your Response:
                  </Typography>
                  <Typography variant="body2">{review.providerResponse}</Typography>
                </Box>
              </>
            )}

            {!review.providerResponse && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenRespond(review.id)}
                >
                  Respond
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {reviewsData && reviewsData.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <AdminPagination
            page={reviewsData.page}
            totalPages={reviewsData.totalPages}
            total={reviewsData.total}
            pageSize={reviewsData.limit}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        </Box>
      )}

      <Dialog open={respondDialogOpen} onClose={handleCloseRespond} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Review</DialogTitle>
        <Formik
          initialValues={{ response: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmitResponse}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form>
              <DialogContent>
                {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {submitError}
                  </Alert>
                )}
                <TextField
                  name="response"
                  label="Your Response"
                  multiline
                  rows={4}
                  fullWidth
                  value={values.response}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.response && Boolean(errors.response)}
                  helperText={touched.response && errors.response}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseRespond}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || submitting}
                >
                  {submitting ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
}
