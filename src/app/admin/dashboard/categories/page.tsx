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
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { useFormik } from "formik";
import * as Yup from "yup";

import { getCategories, createCategory, updateCategory } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { ServiceCategory } from "@/types/admin";

const createValidationSchema = Yup.object({
  name: Yup.string().trim().min(1, "Required").max(100, "Max 100 characters").required("Name is required"),
  slug: Yup.string().trim().min(1, "Required").max(100, "Max 100 characters").matches(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens").required("Slug is required"),
  description: Yup.string().trim().max(500, "Max 500 characters").optional(),
  iconUrl: Yup.string().trim().test('url-or-empty', 'Must be a valid URL', (value) => !value || Yup.string().url().isValidSync(value)),
  sortOrder: Yup.number().integer().min(0, "Min 0").optional(),
});

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getCategories();
    if (response?.status === 200 && response.data.data) {
      setCategories(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load categories.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() { await fetchCategories(); }
    load();
  }, [fetchCategories]);

  const formik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      description: "",
      iconUrl: "",
      sortOrder: 0,
    },
    validationSchema: createValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        slug: values.slug.trim(),
      };
      if (values.description.trim()) payload.description = values.description.trim();
      if (values.iconUrl.trim()) payload.iconUrl = values.iconUrl.trim();
      if (values.sortOrder !== undefined) payload.sortOrder = values.sortOrder;

      let response;
      if (editingCategory) {
        response = await updateCategory(editingCategory.id, payload);
      } else {
        response = await createCategory(payload as Parameters<typeof createCategory>[0]);
      }

      if (response?.status === 200 || response?.status === 201) {
        setSubmitSuccess(editingCategory ? "Category updated." : "Category created.");
        setDialogOpen(false);
        setEditingCategory(null);
        resetForm();
        fetchCategories();
      } else {
        setSubmitError(response?.data?.message || "Operation failed. Please try again.");
      }
      setSubmitting(false);
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    formik.resetForm();
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    formik.setValues({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      iconUrl: category.iconUrl ?? "",
      sortOrder: category.sortOrder,
    });
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    formik.resetForm();
    setSubmitError(null);
  };

  const columns: AdminTableColumn<ServiceCategory>[] = [
    { label: "Name", key: "name" },
    { label: "Slug", key: "slug" },
    {
      label: "Description",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 200, display: "block" }}>
          {row.description || "—"}
        </Typography>
      ),
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
          Category Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Category
        </Button>
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
        rows={categories}
        loading={loading}
        emptyMessage="No categories found."
        rowKey={(row) => row.id}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ pt: 1 }}>
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
              id="iconUrl"
              name="iconUrl"
              label="Icon URL"
              value={formik.values.iconUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.iconUrl && Boolean(formik.errors.iconUrl)}
              helperText={formik.touched.iconUrl && formik.errors.iconUrl}
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : editingCategory ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
