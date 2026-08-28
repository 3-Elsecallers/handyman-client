"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { listCategories, listServices } from "@/api/customer.api";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import type { CustomerServiceCategory, Service } from "@/types/customer";

export default function CustomerServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CustomerServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<Service | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    const response = await listCategories();
    if (response?.status === 200 && response.data.data) {
      setCategories(response.data.data);
    }
    setLoadingCategories(false);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    setError(null);
    const response = await listServices({
      categoryId: selectedCategoryId || undefined,
      search: search || undefined,
    });
    if (response?.status === 200 && response.data.data) {
      setServices(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load services.");
    }
    setLoadingServices(false);
  }, [selectedCategoryId, search]);

  useEffect(() => {
    async function load() {
      await fetchCategories();
    }
    load();
  }, [fetchCategories]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchServices();
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchServices]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? "" : categoryId);
  };

  return (
    <CustomerDashboardShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Services
        </Typography>
        <Typography color="text.secondary">
          Browse our catalog and book a service.
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </Stack>

      <Box sx={{ mb: 3 }}>
        {loadingCategories ? (
          <CircularProgress size={24} />
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="All"
              onClick={() => handleCategorySelect("")}
              color={selectedCategoryId === "" ? "primary" : "default"}
              variant={selectedCategoryId === "" ? "filled" : "outlined"}
            />
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                badgeContent={cat.serviceCount ?? cat._count?.services ?? 0}
                color="primary"
                max={999}
              >
                <Chip
                  label={cat.name}
                  onClick={() => handleCategorySelect(cat.id)}
                  color={selectedCategoryId === cat.id ? "primary" : "default"}
                  variant={selectedCategoryId === cat.id ? "filled" : "outlined"}
                />
              </Badge>
            ))}
          </Stack>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadingServices ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : services.length === 0 ? (
        <Alert severity="info">No services found.</Alert>
      ) : (
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {service.imageUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={service.imageUrl}
                    alt={service.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {service.name}
                  </Typography>
                  <Chip
                    label={service.category?.name ?? "Uncategorized"}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      ₵{service.basePrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.durationMins} min
                    </Typography>
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    sx={{ flexGrow: 1 }}
                    onClick={() => router.push(`/customer/dashboard/new-booking?serviceId=${service.id}`)}
                  >
                    Book
                  </Button>
                  <Button variant="outlined" onClick={() => setDetailService(service)}>
                    Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={Boolean(detailService)}
        onClose={() => setDetailService(null)}
        maxWidth="sm"
        fullWidth
      >
        {detailService && (
          <>
            <DialogTitle>{detailService.name}</DialogTitle>
            <DialogContent>
              {detailService.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={detailService.imageUrl}
                  alt={detailService.name}
                  sx={{ borderRadius: 1, mb: 2 }}
                />
              )}
              <Chip
                label={detailService.category?.name ?? "Uncategorized"}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography
                variant="body1"
                sx={{ mb: 2 }}
              >
                {detailService.description || "No description available."}
              </Typography>
              <Box sx={{ display: "flex", gap: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ₵{detailService.basePrice.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailService.durationMins} min
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailService(null)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDetailService(null);
                  router.push(`/customer/dashboard/new-booking?serviceId=${detailService.id}`);
                }}
              >
                Book
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </CustomerDashboardShell>
  );
}
