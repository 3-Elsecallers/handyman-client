'use client';

import { useCallback, useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorIcon from '@mui/icons-material/Error';

import { getMyScorecard, type ScorecardData } from '@/api/provider.api';

const GRADE_META: Record<string, { color: string; label: string }> = {
  bronze: { color: 'default', label: 'Bronze' },
  silver: { color: 'secondary', label: 'Silver' },
  gold: { color: 'warning', label: 'Gold' },
  platinum: { color: 'primary', label: 'Platinum' },
};

const TIER_META: Record<string, { color: string; label: string }> = {
  apprentice: { color: 'default', label: 'Apprentice' },
  journeyman: { color: 'info', label: 'Journeyman' },
  master: { color: 'primary', label: 'Master' },
};

interface MetricRow {
  label: string;
  value: string;
  target: string;
  unit: 'higher' | 'lower';
}

export default function ProviderScorecardPage() {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getMyScorecard();
    if (res?.status === 200 && res.data.data) {
      setData(res.data.data);
    } else {
      setError('Failed to load scorecard.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) return null;

  const { scorecard, flags } = data;
  const gradeMeta = GRADE_META[scorecard.grade] || GRADE_META.bronze;
  const tierMeta = TIER_META[scorecard.tier] || TIER_META.apprentice;

  const metrics: MetricRow[] = [
    { label: 'Average Rating', value: scorecard.metrics.avgRating.toFixed(1), target: '≥ 4.5', unit: 'higher' },
    { label: 'Total Completed Jobs', value: String(scorecard.metrics.totalJobs), target: 'Grows over time', unit: 'higher' },
    { label: 'Completion Rate', value: `${(scorecard.metrics.completionRate * 100).toFixed(0)}%`, target: '≥ 95%', unit: 'higher' },
    { label: 'Cancellation Rate', value: `${(scorecard.metrics.cancellationRate * 100).toFixed(1)}%`, target: '≤ 5%', unit: 'lower' },
    { label: 'Dispute Rate', value: `${(scorecard.metrics.disputeRate * 100).toFixed(1)}%`, target: '0%', unit: 'lower' },
    { label: 'Avg Response Time', value: scorecard.metrics.avgResponseTimeMins != null ? `${scorecard.metrics.avgResponseTimeMins} min` : '—', target: '≤ 30 min', unit: 'lower' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Quality Scorecard
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Competency Tier</Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                icon={<VerifiedIcon />}
                label={tierMeta.label}
                color={tierMeta.color as 'default' | 'primary' | 'secondary' | 'info' | 'warning'}
              />
            </Box>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Quality Grade</Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                icon={<VerifiedIcon />}
                label={gradeMeta.label}
                color={gradeMeta.color as 'default' | 'primary' | 'secondary' | 'warning'}
              />
            </Box>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Platform Tenure</Typography>
            <Typography variant="h5">{scorecard.tenureDays} days</Typography>
          </CardContent>
        </Card>
      </Box>

      {scorecard.probation.active && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are in your probationary period.{' '}
          {scorecard.probation.bookingsRemaining > 0
            ? `${scorecard.probation.bookingsRemaining} booking(s) remaining before enhanced monitoring ends.`
            : `Monitoring ends ${scorecard.probation.endDate ? new Date(scorecard.probation.endDate).toLocaleDateString() : ''}.`}
        </Alert>
      )}

      {flags.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
              Active Quality Flags
            </Typography>
            {flags.map((flag) => (
              <Box key={flag.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ErrorIcon color={flag.severity === 'critical' ? 'error' : 'warning'} fontSize="small" />
                <Typography variant="body2">{flag.message}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Current Value</TableCell>
                  <TableCell align="right">Target</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.label} hover>
                    <TableCell>{m.label}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{m.value}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={m.unit === 'higher'
                          ? Math.min(100, (parseFloat(m.value) / 5) * 100)
                          : Math.max(0, 100 - parseFloat(m.value) * 5)}
                        sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">{m.target}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Alert severity="info">
        Grades and tiers are recalculated weekly and after each completed booking or review.
      </Alert>
    </Box>
  );
}
