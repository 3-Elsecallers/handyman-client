'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';

import { signIn } from '@/api/authentication.api';
import { clearSession, decodeAccessToken, useAuth } from '@/contexts/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Email address is required'),
  password: Yup.string().trim().required('Password is required'),
});

export default function AdminSignIn() {
  const router = useRouter();
  const { setUser, setLoggedIn } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const response = await signIn(values);

        if (response?.status === 200 && response.data.data) {
          const { accessToken, refreshToken } = response.data.data;
          const user = decodeAccessToken(accessToken);

          if (!user || user.role !== 'admin') {
            // Credentials were valid but this is not an administrator.
            clearSession();
            setApiError('This account does not have administrator access.');
            return;
          }

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          setUser(user);
          setLoggedIn(true);
          router.push('/admin/dashboard');
        } else {
          setApiError(
            response?.data?.message || 'Sign in failed. Please try again.',
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="xs" disableGutters>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          px: 3,
          py: 4,
          justifyContent: 'center',
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Admin Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Restricted area. Administrator credentials required.
          </Typography>
        </Box>

        <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            id="email"
            name="email"
            label="Admin Email"
            autoComplete="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />

          <TextField
            margin="normal"
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>

          {apiError && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 1 }}>
              {apiError}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
}
