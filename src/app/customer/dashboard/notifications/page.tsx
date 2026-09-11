'use client';

import NotificationCenter from '@/components/shared/NotificationCenter';
import CustomerDashboardShell from '@/components/customer/CustomerDashboardShell';
import {
  CUSTOMER_NOTIFICATION_LABELS,
  resolveCustomerNotificationRoute,
} from '@/utils/notificationRoutes';

export default function CustomerNotificationsPage() {
  return (
    <CustomerDashboardShell>
      <NotificationCenter
        title="Notifications"
        labels={CUSTOMER_NOTIFICATION_LABELS}
        resolveRoute={resolveCustomerNotificationRoute}
      />
    </CustomerDashboardShell>
  );
}