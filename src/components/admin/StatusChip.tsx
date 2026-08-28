'use client';

import Chip from '@mui/material/Chip';

import type { ProviderStatus, ReviewStatus, UserStatus, VerificationStatus } from '@/types/admin';
import type { BookingStatus } from '@/types/customer';

type StatusValue =
  | ProviderStatus
  | ReviewStatus
  | UserStatus
  | VerificationStatus
  | BookingStatus;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info' | 'primary' }
> = {
  pending_review: { label: 'Pending Review', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'error' },
  deactivated: { label: 'Deactivated', color: 'default' },
  visible: { label: 'Visible', color: 'success' },
  flagged: { label: 'Flagged', color: 'warning' },
  removed: { label: 'Removed', color: 'error' },
  not_submitted: { label: 'Not Submitted', color: 'default' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'info' },
  in_progress: { label: 'In Progress', color: 'primary' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  disputed: { label: 'Disputed', color: 'warning' },
};

interface StatusChipProps {
  status: StatusValue;
}

export default function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'default' as const,
  };
  return <Chip label={config.label} color={config.color} size="small" />;
}
