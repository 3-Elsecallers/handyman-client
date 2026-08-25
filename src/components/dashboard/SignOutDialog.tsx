'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { signOut } from '@/api/authentication.api';
import { clearSession, useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface SignOutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SignOutDialog({ open, onClose }: SignOutDialogProps) {
  const router = useRouter();
  const { user, setLoggedIn, setUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await signOut({ refreshToken });
      }
    } finally {
      clearSession();
      setLoggedIn(false);
      setUser(null);
      onClose();
      router.push(user?.role === 'admin' ? '/admin/sign-in' : '/sign-in');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      title="Sign Out"
      description="Are you sure you want to sign out of your account?"
      confirmLabel="Sign Out"
      loading={signingOut}
      onConfirm={handleSignOut}
      onClose={onClose}
    />
  );
}
