'use client';

import {
  ADMIN_NOTIFICATION_LABELS,
  resolveNotificationRoute,
} from '@/utils/notificationRoutes';
import NotificationCenter from '@/components/shared/NotificationCenter';

const FILTERS = [
  { label: 'All', value: '' as const },
  {
    label: ADMIN_NOTIFICATION_LABELS.admin_new_signup,
    value: 'admin_new_signup' as const,
  },
  {
    label: ADMIN_NOTIFICATION_LABELS.admin_identity_verification_request,
    value: 'admin_identity_verification_request' as const,
  },
  {
    label: ADMIN_NOTIFICATION_LABELS.admin_service_verification_request,
    value: 'admin_service_verification_request' as const,
  },
  {
    label: ADMIN_NOTIFICATION_LABELS.admin_new_booking,
    value: 'admin_new_booking' as const,
  },
  {
    label: ADMIN_NOTIFICATION_LABELS.admin_booking_cancelled,
    value: 'admin_booking_cancelled' as const,
  },
];

export default function NotificationsPage() {
  return (
    <NotificationCenter
      labels={ADMIN_NOTIFICATION_LABELS}
      resolveRoute={resolveNotificationRoute}
      filters={FILTERS}
    />
  );
}