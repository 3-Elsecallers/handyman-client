'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  getPayoutMethod,
  getProviderWallet,
  listProviderWithdrawals,
  withdrawProvider,
} from '@/api/payment.api';
import type { PayoutRequestStatus, ProviderWallet } from '@/api/payment.api';

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

export default function ProviderWalletPage() {
  const [wallet, setWallet] = useState<ProviderWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<
    { items: { id: string; amount: number; fee: number; netAmount: number; status: PayoutRequestStatus; medium: string; createdAt: string }[]; total: number; totalPages: number } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutSet, setPayoutSet] = useState<boolean | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [walletRes, withdrawalsRes] = await Promise.all([
      getProviderWallet(),
      listProviderWithdrawals({ page: 1, limit: 10 }),
    ]);
    if (walletRes?.status === 200 && walletRes.data.data) {
      setWallet(walletRes.data.data);
    } else {
      setError('Failed to load wallet.');
    }
    if (withdrawalsRes?.status === 200 && withdrawalsRes.data.data) {
      setWithdrawals(withdrawalsRes.data.data);
    }
    setLoading(false);
  }, []);

  const checkPayoutMethod = useCallback(async () => {
    const res = await getPayoutMethod();
    setPayoutSet(res?.status === 200 && res.data.data ? true : false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchData();
    }
    load();
  }, [fetchData]);

  useEffect(() => {
    async function load() {
      await checkPayoutMethod();
    }
    load();
  }, [checkPayoutMethod]);

  const handleOpenWithdraw = () => {
    setAmount('');
    setWithdrawError(null);
    setWithdrawOpen(true);
  };

  const handleCloseWithdraw = () => {
    if (submitting) return;
    setWithdrawOpen(false);
  };

  const handleConfirmWithdraw = async () => {
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setWithdrawError('Enter a valid amount greater than 0.');
      return;
    }
    if (wallet && value > wallet.available) {
      setWithdrawError('Amount exceeds your available balance.');
      return;
    }
    setWithdrawError(null);
    setSubmitting(true);
    const res = await withdrawProvider(value);
    if (res?.status === 200 && res.data.data) {
      setSuccess('Withdrawal requested successfully.');
      setWithdrawOpen(false);
      fetchData();
      checkPayoutMethod();
    } else {
      setWithdrawError('Failed to request withdrawal.');
    }
    setSubmitting(false);
  };

  const statusChip = (status: PayoutRequestStatus) => {
    const config = STATUS_CONFIG[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading && !wallet) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !wallet) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 0 }}>
          Wallet
        </Typography>
        <Button variant="contained" onClick={handleOpenWithdraw}>
          Withdraw
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your earnings and withdrawals.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {payoutSet === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have not set up a payout method yet.{' '}
          <Link href="/provider/dashboard/payout-method" style={{ fontWeight: 600 }}>
            Set one up
          </Link>{' '}
          before requesting a withdrawal.
        </Alert>
      )}

      {wallet && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Available
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  GH₵ {wallet.available.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  On Hold
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  GH₵ {wallet.pendingHold.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Earned
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  GH₵ {wallet.paidOut.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Owed
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  GH₵ {wallet.owed.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
        Recent Withdrawals
      </Typography>

      {withdrawals && withdrawals.items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No withdrawals yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Medium</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withdrawals?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>GH₵ {item.amount.toFixed(2)}</TableCell>
                  <TableCell>GH₵ {item.fee.toFixed(2)}</TableCell>
                  <TableCell>GH₵ {item.netAmount.toFixed(2)}</TableCell>
                  <TableCell>{item.medium}</TableCell>
                  <TableCell>{statusChip(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Withdrawal fees are deducted from the amount and shown to you before confirming.
      </Typography>

      <Dialog open={withdrawOpen} onClose={handleCloseWithdraw} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          {withdrawError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {withdrawError}
            </Alert>
          )}
          {wallet && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available balance: GH₵ {wallet.available.toFixed(2)}
            </Typography>
          )}
          <TextField
            fullWidth
            autoFocus
            label="Amount (GH₵)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdraw} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmWithdraw}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
