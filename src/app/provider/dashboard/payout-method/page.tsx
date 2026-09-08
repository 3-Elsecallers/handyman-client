'use client';

import { useCallback, useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ConfirmDialog from '@/components/shared/ConfirmDialog';
import {
  deletePayoutMethod,
  getPayoutMethod,
  savePayoutMethod,
  updatePayoutMethod,
} from '@/api/payment.api';
import type { PayoutMethod, PayoutMedium } from '@/api/payment.api';

export default function PayoutMethodPage() {
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [medium, setMedium] = useState<PayoutMedium>('mobile_money');
  const [network, setNetwork] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchMethod = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPayoutMethod();
    if (res?.status === 200 && res.data.data) {
      setMethod(res.data.data);
      setEditing(false);
    } else {
      setMethod(null);
      setEditing(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchMethod();
    }
    load();
  }, [fetchMethod]);

  const startEdit = () => {
    setEditing(true);
    if (method) {
      setMedium(method.medium);
      setNetwork(method.network ?? '');
      setBankName(method.bankName ?? '');
      setBankCode(method.bankCode ?? '');
      setAccountName(method.accountName ?? '');
    }
    setAccountNumber('');
    setFormError(null);
  };

  const resetForm = () => {
    setMedium('mobile_money');
    setNetwork('');
    setBankName('');
    setBankCode('');
    setAccountName('');
    setAccountNumber('');
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (medium === 'mobile_money' && !network.trim()) {
      setFormError('Network is required.');
      return;
    }
    if (medium === 'bank' && !bankName.trim()) {
      setFormError('Bank name is required.');
      return;
    }
    if (!accountName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    if (!accountNumber.trim()) {
      setFormError('Account number is required.');
      return;
    }
    setFormError(null);
    setSubmitting(true);

    const base = {
      medium,
      network: medium === 'mobile_money' ? network.trim() : undefined,
      bankName: medium === 'bank' ? bankName.trim() : undefined,
      bankCode: medium === 'bank' && bankCode.trim() ? bankCode.trim() : undefined,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
    };

    let res;
    if (method) {
      res = await updatePayoutMethod(base);
    } else {
      res = await savePayoutMethod(base);
    }

    if ((res?.status === 200 || res?.status === 201) && res.data.data) {
      setSuccess(method ? 'Payout method updated.' : 'Payout method saved.');
      setMethod(res.data.data);
      setEditing(false);
      resetForm();
    } else {
      setFormError('Failed to save payout method.');
    }
    setSubmitting(false);
  };

  const handleCancel = () => {
    if (method) {
      setEditing(false);
    } else {
      resetForm();
    }
    setFormError(null);
  };

  const handleRemove = async () => {
    setRemoving(true);
    const res = await deletePayoutMethod();
    if (res?.status === 200) {
      setSuccess('Payout method removed.');
      setMethod(null);
      setRemoveOpen(false);
      resetForm();
      setEditing(true);
    } else {
      setError('Failed to remove payout method.');
      setRemoveOpen(false);
    }
    setRemoving(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Payout Method
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Set up how you receive your earnings.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {method && !editing ? (
        <Card variant="outlined" sx={{ maxWidth: 560 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Current Payout Method
              </Typography>
              <Chip
                label={method.isActive ? 'Active' : 'Inactive'}
                color={method.isActive ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Medium
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {method.medium === 'mobile_money' ? 'Mobile Money' : 'Bank'}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {method.medium === 'mobile_money' ? 'Network' : 'Bank'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {method.medium === 'mobile_money'
                  ? (method.network ?? '—')
                  : (method.bankName ?? '—')}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Account Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {method.accountName ?? '—'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Account Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                •••••• (last 4 unknown)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={startEdit}>
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setRemoveOpen(true)}
              >
                Remove
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined" sx={{ maxWidth: 560 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {method ? 'Edit Payout Method' : 'Set Up Payout Method'}
            </Typography>

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="medium-label">Medium</InputLabel>
              <Select
                labelId="medium-label"
                label="Medium"
                value={medium}
                onChange={(e) => setMedium(e.target.value as PayoutMedium)}
              >
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
              </Select>
            </FormControl>

            {medium === 'mobile_money' ? (
              <TextField
                fullWidth
                label="Network"
                placeholder="e.g. MTN, Telecel, AirtelTigo"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                sx={{ mb: 2 }}
              />
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Bank Code (optional)"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <TextField
              fullWidth
              label="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <CircularProgress size={20} /> : method ? 'Update' : 'Save'}
              </Button>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={removeOpen}
        title="Remove Payout Method"
        description="Are you sure you want to remove your payout method? You will not be able to receive withdrawals until you set up a new one."
        confirmLabel="Remove"
        loading={removing}
        onConfirm={handleRemove}
        onClose={() => setRemoveOpen(false)}
      />
    </Box>
  );
}
