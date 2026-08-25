'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { updateToken } from '@/api/authentication.api';
import type { UserRole } from '@/config/auth';
import {
  getDashboardPath,
  getRequiredRole,
  getSignInPathFor,
  isPublicAuthPath,
  normalizeRole,
} from '@/config/auth';

export interface IUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface IJWTPayload {
  id: string;
  name: string;
  email?: string;
  role: string;
  exp?: number;
}

interface AuthContextType {
  loggedIn: boolean;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(payload: IJWTPayload): IUser | null {
  const role = normalizeRole(payload.role);
  if (!role) return null;

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role,
  };
}

export function decodeAccessToken(accessToken: string): IUser | null {
  try {
    return toUser(jwtDecode<IJWTPayload>(accessToken));
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function restoreSession(): Promise<{ loggedIn: boolean; user: IUser | null }> {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) {
    clearSession();
    return { loggedIn: false, user: null };
  }

  const payload = jwtDecode<IJWTPayload>(accessToken);
  const isExpired =
    Boolean(payload.exp) && payload.exp! < new Date().getTime() / 1000;

  if (!isExpired) {
    const user = decodeAccessToken(accessToken);
    if (!user) {
      clearSession();
      return { loggedIn: false, user: null };
    }
    return { loggedIn: true, user };
  }

  const response = await updateToken({ refreshToken });
  if (response?.status !== 200 || !response.data.data) {
    clearSession();
    return { loggedIn: false, user: null };
  }

  const tokens = response.data.data;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);

  const user = decodeAccessToken(tokens.accessToken);
  if (!user) {
    clearSession();
    return { loggedIn: false, user: null };
  }

  return { loggedIn: true, user };
}

export default function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathName = usePathname();

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);

  const applySession = useCallback(
    (result: { loggedIn: boolean; user: IUser | null }) => {
      setLoggedIn(result.loggedIn);
      setUser(result.user);

      const requiredRole = getRequiredRole(pathName);

      if (!result.loggedIn && requiredRole) {
        router.replace(getSignInPathFor(pathName));
        return;
      }

      if (!result.loggedIn || !result.user) return;

      // Authenticated users do not belong on the public auth pages.
      if (isPublicAuthPath(pathName)) {
        router.replace(getDashboardPath(result.user.role));
        return;
      }

      // Users may not access another role's area.
      if (requiredRole && requiredRole !== result.user.role) {
        router.replace(getDashboardPath(result.user.role));
      }
    },
    [pathName, router],
  );

  useEffect(() => {
    let isMounted = true;

    restoreSession()
      .then((result) => {
        if (!isMounted) return;
        applySession(result);
      })
      .catch((error: unknown) => {
        console.log(error);
        if (!isMounted) return;
        clearSession();
        applySession({ loggedIn: false, user: null });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applySession]);

  if (loading) {
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

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn, user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
