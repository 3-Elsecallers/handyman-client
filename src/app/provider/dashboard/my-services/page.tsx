'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AssignmentIcon from "@mui/icons-material/Assignment";

import {
  getMyProfile,
  addService,
  getCatalogCategories,
  getCatalogServices,
} from "@/api/provider.api";
import type {
  ProviderProfile,
  ServiceCategory,
  CatalogService,
} from "@/types/provider";

const AddServiceSchema = Yup.object().shape({
  serviceId: Yup.string().uuid("Must be a valid service").required("Service is required"),
  customPrice: Yup.number()
    .min(0, "Price cannot be negative")
    .nullable()
    .optional(),
});

function ServiceStatusChip({ status }: { status?: string }) {
  const map: Record<string, { label: string; color: "success" | "error" | "warning" | "info" | "default" }> = {
    "approved": { label: "Approved", color: "success" },
    "rejected": { label: "Rejected", color: "error" },
    "pending_review": { label: "Pending Review", color: "warning" },
    "not_submitted": { label: "Not Submitted", color: "default" },
  };
  const entry = map[status ?? ""] ?? { label: "Not Submitted", color: "default" as const };
  return <Chip label={entry.label} color={entry.color} size="small" />;
}

export default function MyServicesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getMyProfile();
    if (response?.status === 200 && response.data.data) {
      setProfile(response.data.data);
    } else {
      setError("Failed to load profile.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchProfile();
    }
    load();
  }, [fetchProfile]);

  const handleDialogOpen = async () => {
    setDialogOpen(true);
    setSelectedCategoryId("");
    setCatalogServices([]);
    const response = await getCatalogCategories();
    if (response?.status === 200 && response.data.data) {
      setCategories(response.data.data);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCategoryId("");
    setCatalogServices([]);
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCatalogServices([]);
    setCatalogLoading(true);
    const response = await getCatalogServices(categoryId);
    if (response?.status === 200 && response.data.data) {
      setCatalogServices(response.data.data);
    }
    setCatalogLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton onClick={() => router.push("/provider/dashboard")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 0 }}>
          My Services
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage the services you offer to customers.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleDialogOpen}>
          Add Service
        </Button>
      </Box>

      {profile && profile.services.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You have no services yet. Click &quot;Add Service&quot; to get started.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
        {profile?.services.map((entry) => (
          <Card key={entry.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {entry.service.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ServiceStatusChip status={entry.status} />
                  <Chip
                    label={entry.isActive ? "Active" : "Inactive"}
                    color={entry.isActive ? "success" : "default"}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {entry.status === "rejected" && entry.rejectionNote && (
                <Alert severity="error" sx={{ mb: 1 }}>{entry.rejectionNote}</Alert>
              )}

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Base Price: <strong>₵{entry.service.basePrice.toLocaleString()}</strong>
                </Typography>
                {entry.customPrice != null && (
                  <Typography variant="body2" color="text.secondary">
                    Custom Price: <strong>₵{entry.customPrice.toLocaleString()}</strong>
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Duration: <strong>{entry.service.durationMins} mins</strong>
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/provider/dashboard/my-services/${entry.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant={entry.status === "approved" ? "outlined" : "contained"}
                  size="small"
                  startIcon={<AssignmentIcon />}
                  onClick={() => router.push(`/provider/dashboard/requirements?serviceId=${entry.id}`)}
                >
                  {entry.status === "pending_review" ? "View Requirements" : "Complete Requirements"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add a New Service</DialogTitle>
        <Divider />
        <Formik
          initialValues={{ serviceId: "", customPrice: null }}
          validationSchema={AddServiceSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(undefined);
            const response = await addService({
              serviceId: values.serviceId,
              customPrice: values.customPrice ?? undefined,
            });
            if (response?.status === 201 || response?.status === 200) {
              setSuccess("Service added successfully.");
              handleDialogClose();
              fetchProfile();
            } else {
              setStatus("Failed to add service.");
            }
            setSubmitting(false);
          }}
        >
          {({ values, errors, touched, isSubmitting, status, setFieldValue }) => (
            <Form>
              <DialogContent>
                {status && <Alert severity="error" sx={{ mb: 2 }}>{status}</Alert>}

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    value={selectedCategoryId}
                    label="Category"
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedCategoryId}>
                  <InputLabel id="service-label">Service</InputLabel>
                  <Field name="serviceId">
                    {() => (
                      <Select
                        labelId="service-label"
                        value={values.serviceId}
                        label="Service"
                        onChange={(e) => setFieldValue("serviceId", e.target.value)}
                      >
                        {catalogLoading && (
                          <MenuItem value="" disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} /> Loading services...
                          </MenuItem>
                        )}
                        {catalogServices.map((svc) => (
                          <MenuItem key={svc.id} value={svc.id}>
                            {svc.name} — ₵{svc.basePrice.toLocaleString()}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {touched.serviceId && errors.serviceId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                      {errors.serviceId}
                    </Typography>
                  )}
                </FormControl>

                <Field name="customPrice">
                  {() => (
                    <TextField
                      fullWidth
                      label="Custom Price (optional)"
                      type="number"
                      value={values.customPrice ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldValue("customPrice", val === "" ? null : Number(val));
                      }}
                      error={touched.customPrice && !!errors.customPrice}
                      helperText={touched.customPrice && errors.customPrice}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                  )}
                </Field>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDialogClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : "Add Service"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
}
