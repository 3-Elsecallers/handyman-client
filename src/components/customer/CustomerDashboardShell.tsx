"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PaymentsIcon from "@mui/icons-material/Payments";
import MenuIcon from "@mui/icons-material/Menu";
import HandymanIcon from "@mui/icons-material/Handyman";
import NotificationIcon from "@mui/icons-material/Notifications";

import Badge from "@mui/material/Badge";
import SignOutDialog from "@/components/dashboard/SignOutDialog";
import NotificationBell from "@/components/shared/NotificationBell";
import { resolveCustomerNotificationRoute } from "@/utils/notificationRoutes";

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  notificationBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <DashboardIcon />, href: "/customer/dashboard" },
  { label: "New Booking", icon: <AddCircleIcon />, href: "/customer/dashboard/new-booking" },
  { label: "Services", icon: <StorefrontIcon />, href: "/customer/dashboard/services" },
  { label: "My Bookings", icon: <BookOnlineIcon />, href: "/customer/dashboard/bookings" },
  { label: "Payments", icon: <PaymentsIcon />, href: "/customer/dashboard/payments" },
  { label: "Addresses", icon: <LocationOnIcon />, href: "/customer/dashboard/addresses" },
  {
    label: "Notifications",
    icon: <NotificationIcon />,
    href: "/customer/dashboard/notifications",
    notificationBadge: true,
  },
];

interface CustomerDashboardShellProps {
  children: ReactNode;
}

export default function CustomerDashboardShell({
  children,
}: CustomerDashboardShellProps) {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const drawer = (
    <Box>
      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <HandymanIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Customer Panel
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const selected =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Badge
                  badgeContent={item.notificationBadge ? unreadCount : undefined}
                  color="error"
                  max={99}
                  invisible={!item.notificationBadge || !unreadCount}
                >
                  {item.icon}
                </Badge>
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
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
            sx={{ mr: 2, display: { md: "none" } }}
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
            resolveRoute={resolveCustomerNotificationRoute}
            viewAllHref="/customer/dashboard/notifications"
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
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ py: 4, px: { xs: 2, sm: 4 } }}>{children}</Box>
      </Box>

      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </Box>
  );
}
