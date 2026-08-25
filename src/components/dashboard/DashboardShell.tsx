'use client';

import { useState } from 'react';
import { ReactNode } from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import SignOutDialog from '@/components/dashboard/SignOutDialog';

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Handyman
          </Typography>
          <Button color="inherit" variant="outlined" onClick={() => setSignOutOpen(true)}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {children}
      </Container>

      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </Box>
  );
}
