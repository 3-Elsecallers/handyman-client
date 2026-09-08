'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import {
  listProviderQuality,
  type AdminQualityProvider,
} from '@/api/admin.api';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import AdminPagination from '@/components/admin/AdminPagination';

const GRADE_COLOR: Record<string, 'default' | 'secondary' | 'warning' | 'primary'> = {
  bronze: 'default',
  silver: 'secondary',
  gold: 'warning',
  platinum: 'primary',
};

const TIER_COLOR: Record<string, 'default' | 'info' | 'primary'> = {
  apprentice: 'default',
  journeyman: 'info',
  master: 'primary',
};

export default function AdminQualityDashboardPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<AdminQualityProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState('');
  const [tier, setTier] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await listProviderQuality({
      page,
      limit: 10,
      grade: grade || undefined,
      tier: tier || undefined,
      flagged: flagged || undefined,
    });
    if (res?.status === 200 && res.data.data) {
      const data = res.data.data;
      setProviders(data.providers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, grade, tier, flagged]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: AdminTableColumn<AdminQualityProvider>[] = [
    { label: 'Provider', render: (row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : row.id) },
    {
      label: 'Grade',
      render: (row) => (
        <Chip
          size="small"
          label={row.qualityGrade}
          color={GRADE_COLOR[row.qualityGrade] || 'default'}
        />
      ),
    },
    {
      label: 'Tier',
      render: (row) => (
        <Chip size="small" label={row.competencyTier} color={TIER_COLOR[row.competencyTier] || 'default'} />
      ),
    },
    { label: 'Status', render: (row) => row.status },
    { label: 'Rating', render: (row) => row.avgRating.toFixed(1) },
    { label: 'Jobs', key: 'totalJobs' },
    { label: 'Completion', render: (row) => `${(row.completionRate * 100).toFixed(0)}%` },
    {
      label: 'Flags',
      render: (row) =>
        row.activeFlagCount > 0 ? (
          <Chip size="small" color="error" label={`${row.activeFlagCount}`} />
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Quality
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Grade</InputLabel>
            <Select
              label="Grade"
              value={grade}
              onChange={(e) => { setGrade(e.target.value); setPage(1); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="bronze">Bronze</MenuItem>
              <MenuItem value="silver">Silver</MenuItem>
              <MenuItem value="gold">Gold</MenuItem>
              <MenuItem value="platinum">Platinum</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tier</InputLabel>
            <Select
              label="Tier"
              value={tier}
              onChange={(e) => { setTier(e.target.value); setPage(1); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="apprentice">Apprentice</MenuItem>
              <MenuItem value="journeyman">Journeyman</MenuItem>
              <MenuItem value="master">Master</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Flags</InputLabel>
            <Select
              label="Flags"
              value={flagged ? 'flagged' : ''}
              onChange={(e) => { setFlagged(e.target.value === 'flagged'); setPage(1); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="flagged">Flagged only</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <AdminTable
        columns={columns}
        rows={providers}
        loading={loading}
        emptyMessage="No providers found."
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/dashboard/providers/${row.id}`)}
      />
      {total > 10 && (
        <Box sx={{ mt: 2 }}>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={10}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={() => {}}
          />
        </Box>
      )}
    </Box>
  );
}
