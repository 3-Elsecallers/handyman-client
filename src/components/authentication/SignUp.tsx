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

import { signUp } from '@/api/authentication.api';

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Email address is required'),
  phone: Yup.string()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  password: Yup.string()
    .trim()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
});

interface SignUpProps {
  role: 'customer' | 'provider';
}

export default function SignUp({ role }: SignUpProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const isProvider = role === 'provider';

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        const response = await signUp({ ...values, role });

        if (response?.status === 201 && response.data.data) {
          const { accessToken, refreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // The account starts unverified; email verification comes first.
          router.push('/verify-email');
        } else {
          setApiError(
            response?.data?.message || 'Registration failed. Please try again.',
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
            {isProvider ? 'Become a Provider' : 'Sign Up as Customer'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isProvider
              ? 'Offer your services to homeowners through the platform.'
              : 'Create an account to book trusted professionals.'}
          </Typography>
        </Box>

        <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            id="firstName"
            name="firstName"
            label="First Name"
            autoComplete="given-name"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.firstName && Boolean(formik.errors.firstName)}
            helperText={formik.touched.firstName && formik.errors.firstName}
          />

          <TextField
            margin="normal"
            fullWidth
            id="lastName"
            name="lastName"
            label="Last Name"
            autoComplete="family-name"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.lastName && Boolean(formik.errors.lastName)}
            helperText={formik.touched.lastName && formik.errors.lastName}
          />

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
            id="phone"
            name="phone"
            label="Phone Number"
            autoComplete="tel"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />

          <TextField
            margin="normal"
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={
              (formik.touched.password && formik.errors.password) ||
              'At least 8 characters with an uppercase letter and a number'
            }
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting}
            sx={{ mt: 4, mb: 2, py: 1.5 }}
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Register'
            )}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => router.push('/sign-in')}
            >
              Sign In
            </Button>
          </Box>

          {apiError && (
            <Alert severity="error" variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
              {apiError}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
}
