'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { useAuth } from '@/contexts/AuthContext';

interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export default function DashboardPlaceholder({
  title,
  description,
}: DashboardPlaceholderProps) {
  const { user } = useAuth();

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Welcome, {user?.name}. You are signed in as a {user?.role}.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
