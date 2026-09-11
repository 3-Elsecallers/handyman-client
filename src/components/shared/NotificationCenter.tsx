'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
  type NotificationType,
} from '@/api/communication.api';
import AdminTable from '@/components/admin/AdminTable';
import type { AdminTableColumn } from '@/components/admin/AdminTable';
import type { NotificationRoute } from '@/utils/notificationRoutes';

interface NotificationCenterProps {
  labels: Record<string, string>;
  resolveRoute: (notification: Notification) => NotificationRoute;
  filters?: Array<{ label: string; value: NotificationType | '' }>;
  title?: string;
}

export default function NotificationCenter({
  labels,
  resolveRoute,
  filters = [],
  title = 'Notifications',
}: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationType | ''>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string, append = false) => {
      const request = cursor
        ? () => listNotifications({ limit: 20, cursor, types: filter ? [filter] : undefined })
        : () =>
            listNotifications({
              limit: 20,
              types: filter ? [filter] : undefined,
            });
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      const response = await request();
      if (response?.status === 200 && response.data.data) {
        setNotifications((prev) =>
          append ? [...prev, ...response.data.data.notifications] : response.data.data.notifications,
        );
        setNextCursor(response.data.data.nextCursor);
      } else {
        setError(response?.data?.message || 'Failed to load notifications.');
      }
      if (append) setLoadingMore(false);
      else setLoading(false);
    },
    [filter],
  );

  useEffect(() => {
    async function load() {
      await fetchPage();
    }
    load();
  }, [fetchPage]);

  const handleRowClick = async (notification: Notification) => {
    router.push(resolveRoute(notification).href);
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const response = await markAllNotificationsRead();
    if (response?.status === 200) {
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
    }
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const columns: AdminTableColumn<Notification>[] = [
    {
      label: 'Type',
      render: (row) => (
        <Chip label={labels[row.type] ?? row.type} size="small" />
      ),
    },
    {
      label: 'Message',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: row.readAt ? 400 : 600 }}>
            {row.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', maxWidth: 420 }}
          >
            {row.body}
          </Typography>
        </Box>
      ),
    },
    {
      label: 'Received',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      label: 'Status',
      render: (row) =>
        row.readAt ? (
          <Chip label="Read" size="small" color="default" />
        ) : (
          <Chip label="Unread" size="small" color="warning" />
        ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread
          </Typography>
        </Box>
        <Button
          variant="outlined"
          disabled={markingAll || unreadCount === 0}
          onClick={handleMarkAll}
        >
          Mark all read
        </Button>
      </Box>

      {filters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            size="small"
            onChange={(_, value) =>
              setFilter((value ?? '') as NotificationType | '')
            }
            aria-label="Filter notifications"
          >
            {filters.map((f) => (
              <ToggleButton key={f.label} value={f.value}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={notifications}
        loading={loading}
        emptyMessage="No notifications."
        rowKey={(row) => row.id}
        onRowClick={handleRowClick}
      />

      {nextCursor && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            disabled={loadingMore}
            onClick={() => fetchPage(nextCursor, true)}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
}