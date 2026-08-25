'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

interface AdminNavItemProps {
  label: string;
  icon: ReactNode;
  href: string;
}

export default function AdminNavItem({ label, icon, href }: AdminNavItemProps) {
  const pathname = usePathname();
  const selected = pathname === href || pathname.startsWith(href + '/');

  return (
    <ListItemButton
      component={Link}
      href={href}
      selected={selected}
      sx={{
        borderRadius: 1,
        mb: 0.5,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' },
          '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
