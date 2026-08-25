'use client';

import Chip from '@mui/material/Chip';

import type { ProviderStatus, ReviewStatus } from '@/types/admin';

type StatusValue = ProviderStatus | ReviewStatus;

const STATUS_CONFIG: Record<
  StatusValue,
  { label: string; color: 'warning' | 'success' | 'error' | 'default' }
> = {
  pending_review: { label: 'Pending Review', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'error' },
  deactivated: { label: 'Deactivated', color: 'default' },
  visible: { label: 'Visible', color: 'success' },
  flagged: { label: 'Flagged', color: 'warning' },
  removed: { label: 'Removed', color: 'error' },
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
