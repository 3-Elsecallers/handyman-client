'use client';

import { useAuth } from "@/contexts/AuthContext";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import UserIcon from "@mui/icons-material/Group";
import CustomerIcon from "@mui/icons-material/People";
import ProviderIcon from "@mui/icons-material/Handyman";
import CategoryIcon from "@mui/icons-material/Category";
import ServiceIcon from "@mui/icons-material/Build";
import ReviewIcon from "@mui/icons-material/RateReview";
import AuditIcon from "@mui/icons-material/History";

import { useRouter } from "next/navigation";

const SECTIONS = [
  {
    title: "Users",
    description: "View and manage all platform users.",
    icon: <UserIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/users",
  },
  {
    title: "Customers",
    description: "View customer accounts and activity.",
    icon: <CustomerIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/customers",
  },
  {
    title: "Providers",
    description: "Manage providers, verification and documents.",
    icon: <ProviderIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/providers",
  },
  {
    title: "Categories",
    description: "Manage service categories.",
    icon: <CategoryIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/categories",
  },
  {
    title: "Services",
    description: "Manage the service catalog.",
    icon: <ServiceIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/services",
  },
  {
    title: "Reviews",
    description: "Moderate flagged reviews.",
    icon: <ReviewIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/reviews",
  },
  {
    title: "Audit Log",
    description: "View administrator action history.",
    icon: <AuditIcon sx={{ fontSize: 40 }} />,
    href: "/admin/dashboard/audit-log",
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome, {user?.name}. Use the navigation below to manage the platform.
      </Typography>

      <Grid container spacing={3}>
        {SECTIONS.map((section) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={section.href}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea
                onClick={() => router.push(section.href)}
                sx={{ height: "100%" }}
              >
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>
                    {section.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
