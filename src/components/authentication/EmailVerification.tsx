'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

import { getProfile, resendVerificationEmail, verifyEmail } from '@/api/authentication.api';
import { decodeAccessToken, useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/config/auth';

const validationSchema = Yup.object({
  token: Yup.string()
    .trim()
    .required('Verification token is required'),
});

export default function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setLoggedIn } = useAuth();

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const linkToken = searchParams.get('token');
  const autoVerified = useRef(false);

  const activateSession = useCallback(() => {
    setVerified(true);

    // Registration already issued a session; activate it now that the email
    // address is confirmed.
    const user = decodeAccessToken(localStorage.getItem('accessToken') || '');
    if (user) {
      setUser(user);
      setLoggedIn(true);
    }
  }, [setUser, setLoggedIn]);

  const submitToken = useCallback(
    async (token: string) => {
      setApiError(null);
      setInfoMessage(null);
      setVerifying(true);
      try {
        const response = await verifyEmail({ token });

        if (response?.status === 200) {
          activateSession();
        } else {
          setApiError(
            response?.data?.message ||
              'Email verification failed. Please try again.',
          );
        }
      } finally {
        setVerifying(false);
      }
    },
    [activateSession],
  );

  useEffect(() => {
    if (!linkToken || autoVerified.current) return;
    autoVerified.current = true;
    submitToken(linkToken);
  }, [linkToken, submitToken]);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      // Yield so state updates never happen synchronously within the effect.
      await Promise.resolve();
      if (!isMounted) return;

      setCanResend(Boolean(localStorage.getItem('refreshToken')));

      // An already verified session has no business on this page.
      if (!localStorage.getItem('accessToken')) return;

      const response = await getProfile();
      if (!isMounted) return;
      const profile = response?.status === 200 ? response.data.data : null;
      if (profile?.emailVerified) {
        router.replace(getDashboardPath(profile.role));
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleResend = async () => {
    setApiError(null);
    setInfoMessage(null);
    setResending(true);
    try {
      const response = await resendVerificationEmail();

      if (response?.status === 200) {
        setInfoMessage(response.data.data.message);
      } else {
        setApiError(
          response?.data?.message ||
            'Failed to resend the verification email. Please try again.',
        );
      }
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    const user = decodeAccessToken(localStorage.getItem('accessToken') || '');
    if (user) {
      router.push(getDashboardPath(user.role));
    } else {
      router.push('/sign-in');
    }
  };

  const formik = useFormik({
    initialValues: {
      token: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      await submitToken(values.token.trim());
      setSubmitting(false);
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
            Verify Your Email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We&apos;ve sent a verification link to your email address. Open it to
            confirm your account, or paste the token below.
          </Typography>
        </Box>

        {verified ? (
          <Box>
            <Alert severity="success" variant="outlined" sx={{ borderRadius: 1 }}>
              Your email has been verified successfully.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, py: 1.5 }}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="token"
              name="token"
              label="Verification Token"
              value={formik.values.token}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.token && Boolean(formik.errors.token)}
              helperText={formik.touched.token && formik.errors.token}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={formik.isSubmitting || verifying}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {formik.isSubmitting || verifying ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Verify Email'
              )}
            </Button>

            {canResend && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Didn&apos;t receive the email?
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  disabled={resending}
                  sx={{ ml: 1 }}
                  onClick={handleResend}
                >
                  {resending ? <CircularProgress size={16} color="inherit" /> : 'Resend'}
                </Button>
              </Box>
            )}

            {infoMessage && (
              <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
                {infoMessage}
              </Alert>
            )}

            {apiError && (
              <Alert severity="error" variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
                {apiError}
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
