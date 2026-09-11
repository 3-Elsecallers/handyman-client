'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import AdminNavIcon from '@mui/icons-material/AdminPanelSettings';
import UserIcon from '@mui/icons-material/Group';
import CustomerIcon from '@mui/icons-material/People';
import ProviderIcon from '@mui/icons-material/Handyman';
import CategoryIcon from '@mui/icons-material/Category';
import ServiceIcon from '@mui/icons-material/Build';
import ReviewIcon from '@mui/icons-material/RateReview';
import AuditIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import PercentIcon from '@mui/icons-material/Percent';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';

import AdminNavItem from '@/components/admin/AdminNavItem';
import NotificationBell from '@/components/shared/NotificationBell';
import SignOutDialog from '@/components/dashboard/SignOutDialog';
import { resolveNotificationRoute } from '@/utils/notificationRoutes';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  badge?: boolean;
  notificationBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: <DashboardIcon />, href: '/admin/dashboard' },
  { label: 'Users', icon: <UserIcon />, href: '/admin/dashboard/users' },
  { label: 'Customers', icon: <CustomerIcon />, href: '/admin/dashboard/customers' },
  { label: 'Providers', icon: <ProviderIcon />, href: '/admin/dashboard/providers', badge: true },
  { label: 'Categories', icon: <CategoryIcon />, href: '/admin/dashboard/categories' },
  { label: 'Services', icon: <ServiceIcon />, href: '/admin/dashboard/services' },
  { label: 'Reviews', icon: <ReviewIcon />, href: '/admin/dashboard/reviews' },
  { label: 'Quality', icon: <MilitaryTechIcon />, href: '/admin/dashboard/quality' },
  { label: 'Bookings', icon: <EventIcon />, href: '/admin/dashboard/bookings' },
  { label: 'Finance', icon: <PaymentsIcon />, href: '/admin/dashboard/finance' },
  { label: 'Promo Codes', icon: <PercentIcon />, href: '/admin/dashboard/promos' },
  { label: 'Notifications', icon: <NotificationIcon />, href: '/admin/dashboard/notifications', notificationBadge: true },
  { label: 'Audit Log', icon: <AuditIcon />, href: '/admin/dashboard/audit-log' },
];

interface AdminDashboardShellProps {
  children: ReactNode;
}

export default function AdminDashboardShell({
  children,
}: AdminDashboardShellProps) {
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const drawer = (
    <Box>
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminNavIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Admin Panel
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => (
          <AdminNavItem
            key={item.href}
            {...item}
            badgeCount={item.notificationBadge ? unreadCount : undefined}
          />
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="primary"
        elevation={0}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            Handyman
          </Typography>
          <NotificationBell
            resolveRoute={resolveNotificationRoute}
            viewAllHref="/admin/dashboard/notifications"
            onUnreadChange={setUnreadCount}
          />
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => setSignOutOpen(true)}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ py: 4, px: { xs: 2, sm: 4 } }}>{children}</Box>
      </Box>

      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </Box>
  );
}
