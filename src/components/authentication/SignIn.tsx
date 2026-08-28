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
  AppBar,
  Toolbar,
} from '@mui/material';

import { signIn } from '@/api/authentication.api';
import { clearSession, decodeAccessToken, useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/config/auth';

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Email address is required'),
  password: Yup.string().trim().required('Password is required'),
});

export default function SignIn() {
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
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          const user = decodeAccessToken(accessToken);
          if (user) {
            setUser(user);
            setLoggedIn(true);
            router.push(getDashboardPath(user.role));
            return;
          }

          clearSession();
          setApiError(
            'Signed in, but this account role cannot use the customer portal.',
          );
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
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ cursor: "pointer", flexGrow: 1, fontWeight: 700 }} onClick={() => router.push('/')}>
            Handyman
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xs" disableGutters>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '90vh',
            px: 3,
            py: 4,
            justifyContent: 'center',
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue to your account.
            </Typography>
          </Box>

          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email Address"
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
              <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 1 }}>
                {apiError}
                {apiError.toLowerCase().includes('verify') && (
                  <Button
                    size="small"
                    sx={{ ml: 1, textTransform: 'none' }}
                    onClick={() => router.push('/verify-email')}
                  >
                    Verify now
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Don&apos;t have an account?
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => router.push('/sign-up/customer')}
                >
                  Sign Up as Customer
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => router.push('/sign-up/provider')}
                >
                  Become a Provider
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
