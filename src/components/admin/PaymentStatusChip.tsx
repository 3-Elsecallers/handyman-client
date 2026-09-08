'use client';

import Chip from '@mui/material/Chip';

import type { PaymentStatus } from '@/api/payment.api';
import type { BookingPaymentStatus } from '@/types/customer';

type StatusValue = PaymentStatus | BookingPaymentStatus;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info' | 'primary' }
> = {
  pending: { label: 'Pending', color: 'warning' },
  authorized: { label: 'Authorized', color: 'info' },
  accepted: { label: 'Accepted', color: 'info' },
  in_progress: { label: 'In Progress', color: 'primary' },
  cash_outstanding: { label: 'Cash Outstanding', color: 'warning' },
  cash_collected: { label: 'Cash Collected', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  confirmed: { label: 'Confirmed', color: 'info' },
  refunded: { label: 'Refunded', color: 'default' },
  partially_refunded: { label: 'Partially Refunded', color: 'default' },
  failed: { label: 'Failed', color: 'error' },
};

interface PaymentStatusChipProps {
  status: StatusValue;
  size?: 'small' | 'medium';
}

export default function PaymentStatusChip({
  status,
  size = 'small',
}: PaymentStatusChipProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'default' as const,
  };
  return <Chip label={config.label} color={config.color} size={size} />;
}
