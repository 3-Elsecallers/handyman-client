'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { useFormik } from "formik";
import * as Yup from "yup";

import { getCategories, getServices, createService, updateService } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { Service, ServiceCategory } from "@/types/admin";

const createValidationSchema = Yup.object({
  categoryId: Yup.string().required("Category is required"),
  name: Yup.string().trim().min(1, "Required").max(100, "Max 100 characters").required("Name is required"),
  slug: Yup.string().trim().min(1, "Required").max(100, "Max 100 characters").matches(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens").required("Slug is required"),
  description: Yup.string().trim().max(1000, "Max 1000 characters").optional(),
  basePrice: Yup.number().min(0, "Min 0").required("Base price is required"),
  durationMins: Yup.number().integer().min(15, "Min 15 minutes").max(480, "Max 480 minutes").required("Duration is required"),
  imageUrl: Yup.string().trim().test('url-or-empty', 'Must be a valid URL', (value) => !value || Yup.string().url().isValidSync(value)),
  sortOrder: Yup.number().integer().min(0, "Min 0").optional(),
});

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const categoryMap = categories.reduce<Record<string, ServiceCategory>>(
    (acc, cat) => ({ ...acc, [cat.id]: cat }),
    {},
  );

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getServices(categoryFilter ? { categoryId: categoryFilter } : undefined);
    if (response?.status === 200 && response.data.data) {
      setServices(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load services.");
    }
    setLoading(false);
  }, [categoryFilter]);

  const fetchCategories = useCallback(async () => {
    const response = await getCategories();
    if (response?.status === 200 && response.data.data) {
      setCategories(response.data.data);
    }
  }, []);

  useEffect(() => {
    async function load() { await fetchCategories(); }
    load();
  }, [fetchCategories]);

  useEffect(() => {
    async function load() { await fetchServices(); }
    load();
  }, [fetchServices]);

  const formik = useFormik({
    initialValues: {
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      basePrice: 0,
      durationMins: 60,
      imageUrl: "",
      sortOrder: 0,
    },
    validationSchema: createValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload: Record<string, unknown> = {
        categoryId: values.categoryId,
        name: values.name.trim(),
        slug: values.slug.trim(),
        basePrice: values.basePrice,
        durationMins: values.durationMins,
      };
      if (values.description.trim()) payload.description = values.description.trim();
      if (values.imageUrl.trim()) payload.imageUrl = values.imageUrl.trim();
      if (values.sortOrder !== undefined) payload.sortOrder = values.sortOrder;

      let response;
      if (editingService) {
        response = await updateService(editingService.id, payload);
      } else {
        response = await createService(payload as Parameters<typeof createService>[0]);
      }

      if (response?.status === 200 || response?.status === 201) {
        setSubmitSuccess(editingService ? "Service updated." : "Service created.");
        setDialogOpen(false);
        setEditingService(null);
        resetForm();
        fetchServices();
      } else {
        setSubmitError(response?.data?.message || "Operation failed. Please try again.");
      }
      setSubmitting(false);
    },
  });

  const handleOpenCreate = () => {
    setEditingService(null);
    formik.resetForm();
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    formik.setValues({
      categoryId: service.categoryId,
      name: service.name,
      slug: service.slug,
      description: service.description ?? "",
      basePrice: service.basePrice,
      durationMins: service.durationMins,
      imageUrl: service.imageUrl ?? "",
      sortOrder: service.sortOrder,
    });
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    formik.resetForm();
    setSubmitError(null);
  };

  const columns: AdminTableColumn<Service>[] = [
    { label: "Name", key: "name" },
    {
      label: "Category",
      render: (row) => categoryMap[row.categoryId]?.name ?? row.categoryId,
    },
    {
      label: "Base Price",
      render: (row) => `$${row.basePrice.toFixed(2)}`,
    },
    {
      label: "Duration",
      render: (row) => `${row.durationMins} min`,
    },
    { label: "Sort", key: "sortOrder" },
    {
      label: "Active",
      render: (row) => (
        <Chip
          label={row.isActive ? "Yes" : "No"}
          size="small"
          color={row.isActive ? "success" : "default"}
        />
      ),
    },
    {
      label: "Actions",
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(row);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Service Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Service
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Filter by Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
          {submitSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={services}
        loading={loading}
        emptyMessage="No services found."
        rowKey={(row) => row.id}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService ? "Edit Service" : "Create Service"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal" error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}>
              <InputLabel>Category</InputLabel>
              <Select
                id="categoryId"
                name="categoryId"
                label="Category"
                value={formik.values.categoryId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.categoryId && formik.errors.categoryId && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                  {formik.errors.categoryId}
                </Typography>
              )}
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              name="name"
              label="Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              margin="normal"
              fullWidth
              id="slug"
              name="slug"
              label="Slug"
              value={formik.values.slug}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.slug && Boolean(formik.errors.slug)}
              helperText={formik.touched.slug && formik.errors.slug}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              name="description"
              label="Description"
              multiline
              rows={2}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
            <TextField
              margin="normal"
              fullWidth
              id="basePrice"
              name="basePrice"
              label="Base Price"
              type="number"
              value={formik.values.basePrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.basePrice && Boolean(formik.errors.basePrice)}
              helperText={formik.touched.basePrice && formik.errors.basePrice}
            />
            <TextField
              margin="normal"
              fullWidth
              id="durationMins"
              name="durationMins"
              label="Duration (minutes)"
              type="number"
              value={formik.values.durationMins}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.durationMins && Boolean(formik.errors.durationMins)}
              helperText={formik.touched.durationMins && formik.errors.durationMins}
            />
            <TextField
              margin="normal"
              fullWidth
              id="imageUrl"
              name="imageUrl"
              label="Image URL"
              value={formik.values.imageUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.imageUrl && Boolean(formik.errors.imageUrl)}
              helperText={formik.touched.imageUrl && formik.errors.imageUrl}
            />
            <TextField
              margin="normal"
              fullWidth
              id="sortOrder"
              name="sortOrder"
              label="Sort Order"
              type="number"
              value={formik.values.sortOrder}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.sortOrder && Boolean(formik.errors.sortOrder)}
              helperText={formik.touched.sortOrder && formik.errors.sortOrder}
            />
          </Box>
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : editingService ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
