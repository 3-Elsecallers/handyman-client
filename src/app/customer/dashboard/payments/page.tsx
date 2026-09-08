'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { listCustomerPayments } from '@/api/payment.api';
import type { Payment } from '@/api/payment.api';
import CustomerDashboardShell from '@/components/customer/CustomerDashboardShell';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }
> = {
  pending: { label: 'Pending', color: 'warning' },
  authorized: { label: 'Authorized', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  refunded: { label: 'Refunded', color: 'default' },
  partially_refunded: { label: 'Partially Refunded', color: 'default' },
  failed: { label: 'Failed', color: 'error' },
};

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await listCustomerPayments();
      if (res?.status === 200 && res.data.data) {
        setPayments(res.data.data.payments);
      } else {
        setError(res?.data?.message || 'Failed to load payments.');
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <CustomerDashboardShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Payment History
        </Typography>
        <Typography color="text.secondary">
          View your past payments and transactions.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : payments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No payments yet.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Booking</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tip</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => {
                const statusCfg = STATUS_CONFIG[payment.status] ?? {
                  label: payment.status,
                  color: 'default' as const,
                };
                return (
                  <TableRow
                    key={payment.id}
                    hover
                    onClick={() =>
                      router.push(
                        `/customer/dashboard/bookings/${payment.bookingId}`,
                      )
                    }
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>#{payment.bookingId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentMethod}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>₵{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {payment.tipAmount > 0
                        ? `₵${payment.tipAmount.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusCfg.label}
                        color={statusCfg.color}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CustomerDashboardShell>
  );
}
