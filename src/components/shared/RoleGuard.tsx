'use client';

import { ReactNode } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/config/auth';

interface RoleGuardProps {
  allow: UserRole;
  children: ReactNode;
}

/**
 * Renders children only for the allowed role. Session restoration and
 * redirects are handled by the AuthContext; this guard simply prevents any
 * protected content from rendering for the wrong role.
 */
export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const { loading, loggedIn, user } = useAuth();

  if (loading || !loggedIn || !user || user.role !== allow) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
