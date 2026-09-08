'use client';

import { useCallback, useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { listProviderWithdrawals } from '@/api/payment.api';
import type { PayoutRequest, PayoutRequestStatus } from '@/api/payment.api';
import AdminPagination from '@/components/admin/AdminPagination';

const STATUS_CONFIG: Record<
  PayoutRequestStatus,
  { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }
> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  processed: { label: 'Processed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  reversed: { label: 'Reversed', color: 'default' },
};

export default function ProviderWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<PayoutRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listProviderWithdrawals({ page, limit: pageSize });
    if (res?.status === 200 && res.data.data) {
      setWithdrawals(res.data.data.items);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } else {
      setError('Failed to load withdrawals.');
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    async function load() {
      await fetchWithdrawals();
    }
    load();
  }, [fetchWithdrawals]);

  const statusChip = (status: PayoutRequestStatus) => {
    const config = STATUS_CONFIG[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Withdrawals
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your complete withdrawal history.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && withdrawals.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Paystack Ref</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withdrawals.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell>GH₵ {item.amount.toFixed(2)}</TableCell>
                  <TableCell>GH₵ {item.fee.toFixed(2)}</TableCell>
                  <TableCell>GH₵ {item.netAmount.toFixed(2)}</TableCell>
                  <TableCell>{statusChip(item.status)}</TableCell>
                  <TableCell>{item.paystackRef ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Box>
  );
}
