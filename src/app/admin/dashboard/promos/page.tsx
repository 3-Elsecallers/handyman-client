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
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { Form, Field, Formik } from "formik";
import * as Yup from "yup";

import {
  createPromo,
  deletePromo,
  listPromos,
  updatePromo,
} from "@/api/booking.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { PromoCode } from "@/types/customer";

interface PromoFormValues {
  code: string;
  description: string;
  discountType: "pct" | "amt";
  discountValue: string;
  maxUses: string;
  expiresAt: string;
}

const validationSchema = Yup.object({
  code: Yup.string()
    .trim()
    .min(3, "At least 3 characters")
    .matches(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, underscore or hyphen only")
    .required("Code is required"),
  description: Yup.string().trim().max(500, "Max 500 characters").optional(),
  discountValue: Yup.number()
    .nullable()
    .typeError("Must be a number")
    .when("discountType", {
      is: "pct",
      then: (schema) =>
        schema
          .required("Discount is required")
          .min(0, "Min 0")
          .max(100, "Max 100"),
      otherwise: (schema) =>
        schema.required("Discount is required").min(0.01, "Must be positive"),
    }),
  maxUses: Yup.number()
    .nullable()
    .typeError("Must be an integer")
    .integer("Must be an integer")
    .positive("Must be positive")
    .optional(),
  expiresAt: Yup.string().optional(),
});

const emptyValues: PromoFormValues = {
  code: "",
  description: "",
  discountType: "pct",
  discountValue: "",
  maxUses: "",
  expiresAt: "",
};

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listPromos({ page, limit: pageSize });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setPromos(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } else {
      setError(response?.data?.message || "Failed to load promo codes.");
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    async function load() { await fetchPromos(); }
    load();
  }, [fetchPromos]);

  const toInitialValues = (promo?: PromoCode | null): PromoFormValues => {
    if (!promo) return emptyValues;
    return {
      code: promo.code,
      description: promo.description ?? "",
      discountType: promo.discountPct != null ? "pct" : "amt",
      discountValue:
        promo.discountPct != null ? String(promo.discountPct) : String(promo.discountAmt ?? ""),
      maxUses: promo.maxUses != null ? String(promo.maxUses) : "",
      expiresAt: promo.expiresAt
        ? new Date(promo.expiresAt).toISOString().slice(0, 16)
        : "",
    };
  };

  const handleSubmit = async (values: PromoFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload: Parameters<typeof createPromo>[0] = {
      code: values.code.trim(),
    };
    if (values.description.trim()) payload.description = values.description.trim();
    if (values.discountType === "pct") {
      payload.discountPct = Number(values.discountValue);
    } else {
      payload.discountAmt = Number(values.discountValue);
    }
    if (values.maxUses) payload.maxUses = Number(values.maxUses);
    if (values.expiresAt) payload.expiresAt = new Date(values.expiresAt).toISOString();

    let response;
    if (editingPromo) {
      response = await updatePromo(editingPromo.id, payload);
    } else {
      response = await createPromo(payload);
    }

    if (response?.status === 200 || response?.status === 201) {
      setSubmitSuccess(editingPromo ? "Promo code updated." : "Promo code created.");
      setDialogOpen(false);
      setEditingPromo(null);
      fetchPromos();
    } else {
      setSubmitError(response?.data?.message || "Failed to save promo code.");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingPromo) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const response = await deletePromo(deletingPromo.id);
    if (response?.status === 200) {
      setSubmitSuccess(`Promo code "${deletingPromo.code}" has been deleted.`);
      setDeleteConfirmOpen(false);
      setDeletingPromo(null);
      fetchPromos();
    } else {
      setDeleteError(response?.data?.message || "Failed to delete promo code.");
    }
    setDeleteLoading(false);
  };

  const openCreate = () => {
    setEditingPromo(null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromo(null);
    setSubmitError(null);
  };

  const discountLabel = (promo: PromoCode) => {
    if (promo.discountPct != null) return `${promo.discountPct}%`;
    if (promo.discountAmt != null) return `₵${promo.discountAmt}`;
    return "—";
  };

  const columns: AdminTableColumn<PromoCode>[] = [
    {
      label: "Code",
      render: (row) => (
        <Typography sx={{ fontWeight: 600, fontFamily: "monospace" }}>{row.code}</Typography>
      ),
    },
    { label: "Discount", render: (row) => discountLabel(row) },
    {
      label: "Max Uses",
      render: (row) => (row.maxUses != null ? row.maxUses : "∞"),
    },
    {
      label: "Used",
      render: (row) => row.usedCount,
    },
    {
      label: "Expires",
      render: (row) =>
        row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "—",
    },
    {
      label: "Status",
      render: (row) => (
        <Chip
          label={row.isActive ? "Active" : "Inactive"}
          size="small"
          color={row.isActive ? "success" : "default"}
        />
      ),
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingPromo(row);
                setDeleteError(null);
                setDeleteConfirmOpen(true);
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const formikValues: PromoFormValues = toInitialValues(editingPromo);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Promo Codes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Create Promo
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
        rows={promos}
        loading={loading}
        emptyMessage="No promo codes found."
        rowKey={(row) => row.id}
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <Formik
          key={editingPromo?.id ?? "create"}
          initialValues={formikValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, errors, touched }) => (
            <Form>
              <DialogTitle>{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
              <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                  <Field name="code">
                    {() => (
                      <TextField
                        fullWidth
                        id="code"
                        name="code"
                        label="Code"
                        value={values.code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.code && Boolean(errors.code)}
                        helperText={touched.code && errors.code}
                        disabled={Boolean(editingPromo)}
                      />
                    )}
                  </Field>
                  <Field name="description">
                    {() => (
                      <TextField
                        fullWidth
                        id="description"
                        name="description"
                        label="Description"
                        multiline
                        rows={2}
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && Boolean(errors.description)}
                        helperText={touched.description && errors.description}
                      />
                    )}
                  </Field>
                  <RadioGroup row name="discountType" value={values.discountType} onChange={handleChange}>
                    <FormControlLabel value="pct" control={<Radio />} label="Percentage (%)" />
                    <FormControlLabel value="amt" control={<Radio />} label="Fixed amount (₵)" />
                  </RadioGroup>
                  <Field name="discountValue">
                    {() => (
                      <TextField
                        fullWidth
                        id="discountValue"
                        name="discountValue"
                        label={values.discountType === "pct" ? "Discount (%)" : "Discount (₵)"}
                        type="number"
                        value={values.discountValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.discountValue && Boolean(errors.discountValue)}
                        helperText={touched.discountValue && errors.discountValue}
                      />
                    )}
                  </Field>
                  <Field name="maxUses">
                    {() => (
                      <TextField
                        fullWidth
                        id="maxUses"
                        name="maxUses"
                        label="Max Uses (optional)"
                        type="number"
                        value={values.maxUses}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.maxUses && Boolean(errors.maxUses)}
                        helperText={touched.maxUses && errors.maxUses}
                      />
                    )}
                  </Field>
                  <Field name="expiresAt">
                    {() => (
                      <TextField
                        fullWidth
                        id="expiresAt"
                        name="expiresAt"
                        label="Expires At (optional)"
                        type="datetime-local"
                        value={values.expiresAt}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.expiresAt && Boolean(errors.expiresAt)}
                        helperText={touched.expiresAt && errors.expiresAt}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    )}
                  </Field>
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
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : editingPromo ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Promo Code"
        description={
          deletingPromo
            ? `Are you sure you want to delete promo code "${deletingPromo.code}"?`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingPromo(null);
          setDeleteError(null);
        }}
      >
        {deleteError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteError}
          </Alert>
        )}
      </ConfirmDialog>
    </Box>
  );
}
