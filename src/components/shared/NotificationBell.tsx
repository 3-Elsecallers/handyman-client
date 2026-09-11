'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import NotificationIcon from '@mui/icons-material/Notifications';

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@/api/communication.api';
import { communicationSocket } from '@/lib/ws';
import type { NotificationRoute } from '@/utils/notificationRoutes';

const POLL_INTERVAL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationBellProps {
  resolveRoute: (notification: Notification) => NotificationRoute;
  viewAllHref: string;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationBell({
  resolveRoute,
  viewAllHref,
  onUnreadChange,
}: NotificationBellProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  const refreshUnread = useCallback(async () => {
    const response = await getUnreadNotificationCount();
    if (response?.status === 200 && response.data.data) {
      setUnreadCount(response.data.data.count);
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    const response = await listNotifications({ limit: 20 });
    if (response?.status === 200 && response.data.data) {
      setNotifications(response.data.data.notifications);
      knownIds.current = new Set(
        response.data.data.notifications.map((n: Notification) => n.id),
      );
    }
    setLoading(false);
  }, []);

  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      refreshList();
      refreshUnread();
    },
    [refreshList, refreshUnread],
  );

  const closeMenu = useCallback(() => setAnchorEl(null), []);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      closeMenu();
      router.push(resolveRoute(notification).href);
      if (!notification.readAt) {
        await markNotificationRead(notification.id);
        refreshUnread();
      }
    },
    [closeMenu, resolveRoute, router, refreshUnread],
  );

  const handleMarkAll = useCallback(async () => {
    setMarkingAll(true);
    const response = await markAllNotificationsRead();
    if (response?.status === 200) {
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
    }
    setMarkingAll(false);
  }, []);

  const handleViewAll = useCallback(() => {
    closeMenu();
    router.push(viewAllHref);
  }, [closeMenu, router, viewAllHref]);

  useEffect(() => {
    async function loadUnread() {
      await refreshUnread();
    }
    loadUnread();

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    const unsubscribe = communicationSocket.on('notification:new', (data) => {
      const notification = data as Notification;
      if (!notification?.id) return;
      if (knownIds.current.has(notification.id)) return;
      knownIds.current.add(notification.id);
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    });

    if (token) {
      communicationSocket.connect(token);
    }

    const pollTimer = setInterval(refreshUnread, POLL_INTERVAL_MS);

    const onFocus = () => refreshUnread();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
      communicationSocket.disconnect();
    };
  }, [refreshUnread]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        sx={{ mr: 1 }}
        onClick={openMenu}
        aria-label="Notifications"
      >
        <Badge badgeContent={unreadCount || null} color="error" max={99}>
          <NotificationIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 480,
              mt: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Button
            size="small"
            disabled={markingAll || unreadCount === 0}
            onClick={handleMarkAll}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />

        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              You&apos;re all caught up.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ py: 1 }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    mt: 1,
                    width: 8,
                    height: 8,
                    minWidth: 8,
                    borderRadius: '50%',
                    bgcolor: notification.readAt ? 'transparent' : 'error.main',
                    border: notification.readAt ? '1px solid transparent' : 'none',
                  }}
                />
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.readAt ? 400 : 600,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" component="span">
                      {notification.body}
                    </Typography>
                  }
                  slotProps={{ secondary: { sx: { mt: 0.5 } } }}
                  sx={{
                    '& .MuiListItemText-secondary': {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
                >
                  {timeAgo(notification.createdAt)}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={handleViewAll}
            sx={{ color: (theme) => alpha(theme.palette.primary.main, 0.9) }}
          >
            View all notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
}