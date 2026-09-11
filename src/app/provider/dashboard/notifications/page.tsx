'use client';

import NotificationCenter from '@/components/shared/NotificationCenter';
import {
  PROVIDER_NOTIFICATION_LABELS,
  resolveProviderNotificationRoute,
} from '@/utils/notificationRoutes';

export default function ProviderNotificationsPage() {
  return (
    <NotificationCenter
      title="Notifications"
      labels={PROVIDER_NOTIFICATION_LABELS}
      resolveRoute={resolveProviderNotificationRoute}
      filters={[
        { label: 'All', value: '' },
        {
          label: PROVIDER_NOTIFICATION_LABELS.verification_result,
          value: 'verification_result',
        },
        { label: PROVIDER_NOTIFICATION_LABELS.new_review, value: 'new_review' },
      ]}
    />
  );
}