'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { useFormik } from "formik";

import {
  getServices,
  getServiceRequirements,
  createServiceRequirement,
  updateServiceRequirement,
  deleteServiceRequirement,
  getServiceQuestions,
  createServiceQuestion,
  updateServiceQuestion,
  deleteServiceQuestion,
} from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type {
  ServiceVettingRequirement,
  ServiceQuestion,
  Service,
} from "@/types/admin";

import { useParams, useRouter } from "next/navigation";

export default function ServiceRequirementsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [requirements, setRequirements] = useState<ServiceVettingRequirement[]>([]);
  const [questions, setQuestions] = useState<ServiceQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<ServiceVettingRequirement | null>(null);
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSubmitError, setReqSubmitError] = useState<string | null>(null);

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ServiceQuestion | null>(null);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSubmitError, setQuestionSubmitError] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: "requirement" | "question"; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [questionOptions, setQuestionOptions] = useState<string[]>([""]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [svcRes, reqRes, qRes] = await Promise.all([
      getServices({ includeInactive: true }),
      getServiceRequirements(serviceId),
      getServiceQuestions(serviceId),
    ]);

    if (svcRes?.status === 200 && svcRes.data.data) {
      const found = svcRes.data.data.find((s: { id: string }) => s.id === serviceId);
      setService(found ?? null);
    }
    if (reqRes?.status === 200 && reqRes.data.data) {
      setRequirements(reqRes.data.data);
    }
    if (qRes?.status === 200 && qRes.data.data) {
      setQuestions(qRes.data.data);
    }
    if (!svcRes || svcRes.status !== 200) {
      setError(svcRes?.data?.message || "Failed to load service.");
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    const id = setTimeout(fetchData, 0);
    return () => clearTimeout(id);
  }, [fetchData]);

  const requirementFormik = useFormik({
    initialValues: {
      type: "document" as "document" | "attestation" | "certification",
      name: "",
      description: "",
      isRequired: true,
      acceptedMimeTypes: "",
      maxFileSizeMb: 5,
      sortOrder: 0,
    },
    onSubmit: async (values) => {
      setReqSubmitting(true);
      setReqSubmitError(null);
      const mimeTypes = values.acceptedMimeTypes
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const payload = {
        type: values.type,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        isRequired: values.isRequired,
        acceptedMimeTypes: mimeTypes.length > 0 ? mimeTypes : undefined,
        maxFileSizeMb: values.maxFileSizeMb,
        sortOrder: values.sortOrder,
      };

      let response;
      if (editingRequirement) {
        response = await updateServiceRequirement(editingRequirement.id, payload);
      } else {
        response = await createServiceRequirement(serviceId, payload);
      }

      if (response?.status === 200 || response?.status === 201) {
        setReqDialogOpen(false);
        setEditingRequirement(null);
        requirementFormik.resetForm();
        fetchData();
      } else {
        setReqSubmitError(response?.data?.message || "Operation failed.");
      }
      setReqSubmitting(false);
    },
  });

  const questionFormik = useFormik({
    initialValues: {
      question: "",
      type: "yes_no" as "yes_no" | "text" | "single_choice" | "multiple_choice",
      isRequired: true,
      sortOrder: 0,
    },
    onSubmit: async (values) => {
      setQuestionSubmitting(true);
      setQuestionSubmitError(null);

      const hasOptions = values.type === "single_choice" || values.type === "multiple_choice";
      const options = hasOptions
        ? questionOptions.filter((o) => o.trim() !== "")
        : undefined;

      const payload = {
        question: values.question.trim(),
        type: values.type,
        isRequired: values.isRequired,
        sortOrder: values.sortOrder,
        options,
      };

      let response;
      if (editingQuestion) {
        response = await updateServiceQuestion(editingQuestion.id, payload);
      } else {
        response = await createServiceQuestion(serviceId, payload);
      }

      if (response?.status === 200 || response?.status === 201) {
        setQuestionDialogOpen(false);
        setEditingQuestion(null);
        questionFormik.resetForm();
        setQuestionOptions([""]);
        fetchData();
      } else {
        setQuestionSubmitError(response?.data?.message || "Operation failed.");
      }
      setQuestionSubmitting(false);
    },
  });

  const handleOpenCreateRequirement = () => {
    setEditingRequirement(null);
    requirementFormik.resetForm();
    setReqSubmitError(null);
    setReqDialogOpen(true);
  };

  const handleOpenEditRequirement = (req: ServiceVettingRequirement) => {
    setEditingRequirement(req);
    requirementFormik.setValues({
      type: req.type,
      name: req.name,
      description: req.description ?? "",
      isRequired: req.isRequired,
      acceptedMimeTypes: req.acceptedMimeTypes.join(", "),
      maxFileSizeMb: req.maxFileSizeMb,
      sortOrder: req.sortOrder,
    });
    setReqSubmitError(null);
    setReqDialogOpen(true);
  };

  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null);
    questionFormik.resetForm();
    setQuestionOptions([""]);
    setQuestionSubmitError(null);
    setQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (q: ServiceQuestion) => {
    setEditingQuestion(q);
    questionFormik.setValues({
      question: q.question,
      type: q.type,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
    });
    setQuestionOptions(q.options.length > 0 ? [...q.options] : [""]);
    setQuestionSubmitError(null);
    setQuestionDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    setDeleteError(null);

    let response;
    if (deletingItem.type === "requirement") {
      response = await deleteServiceRequirement(deletingItem.id);
    } else {
      response = await deleteServiceQuestion(deletingItem.id);
    }

    if (response?.status === 200) {
      setDeleteConfirmOpen(false);
      setDeletingItem(null);
      fetchData();
    } else {
      setDeleteError(response?.data?.message || "Failed to delete.");
    }
    setDeleteLoading(false);
  };

  const requirementColumns: AdminTableColumn<ServiceVettingRequirement>[] = [
    { label: "Name", key: "name" },
    {
      label: "Type",
      render: (row) => <Chip label={row.type} size="small" color="primary" />,
    },
    {
      label: "Required",
      render: (row) => (
        <Chip
          label={row.isRequired ? "Yes" : "No"}
          size="small"
          color={row.isRequired ? "success" : "default"}
        />
      ),
    },
    {
      label: "MIME Types",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 150, display: "block" }}>
          {row.acceptedMimeTypes.length > 0 ? row.acceptedMimeTypes.join(", ") : "—"}
        </Typography>
      ),
    },
    { label: "Sort Order", key: "sortOrder" },
    {
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditRequirement(row);
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
                setDeletingItem({ type: "requirement", id: row.id, name: row.name });
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

  const questionColumns: AdminTableColumn<ServiceQuestion>[] = [
    { label: "Question", key: "question" },
    {
      label: "Type",
      render: (row) => <Chip label={row.type} size="small" color="secondary" />,
    },
    {
      label: "Options",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 200, display: "block" }}>
          {row.options.length > 0 ? row.options.join(", ") : "—"}
        </Typography>
      ),
    },
    {
      label: "Required",
      render: (row) => (
        <Chip
          label={row.isRequired ? "Yes" : "No"}
          size="small"
          color={row.isRequired ? "success" : "default"}
        />
      ),
    },
    { label: "Sort Order", key: "sortOrder" },
    {
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditQuestion(row);
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
                setDeletingItem({ type: "question", id: row.id, name: row.question });
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

  const showQuestionOptions =
    questionFormik.values.type === "single_choice" ||
    questionFormik.values.type === "multiple_choice";

  const handleAddOption = () => setQuestionOptions([...questionOptions, ""]);
  const handleRemoveOption = (index: number) =>
    setQuestionOptions(questionOptions.filter((_, i) => i !== index));
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...questionOptions];
    updated[index] = value;
    setQuestionOptions(updated);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/dashboard/services")}
        >
          Back to Services
        </Button>
      </Box>

      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        Service Requirements - {service?.name ?? "Loading..."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        These requirements and questions apply only to {service?.name ?? "this service"}. Providers must
        submit them before this service can be individually approved by an admin.
      </Alert>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Service Requirements
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateRequirement}>
              Add Requirement
            </Button>
          </Box>
          <AdminTable
            columns={requirementColumns}
            rows={requirements}
            loading={false}
            emptyMessage="No service-specific requirements configured."
            rowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Service Questions
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateQuestion}>
              Add Question
            </Button>
          </Box>
          <AdminTable
            columns={questionColumns}
            rows={questions}
            loading={false}
            emptyMessage="No service-specific questions configured."
            rowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={reqDialogOpen} onClose={() => setReqDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRequirement ? "Edit Requirement" : "Create Requirement"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={requirementFormik.handleSubmit} noValidate sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={requirementFormik.values.type}
                onChange={requirementFormik.handleChange}
                label="Type"
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="attestation">Attestation</MenuItem>
                <MenuItem value="certification">Certification</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              name="name"
              label="Name"
              value={requirementFormik.values.name}
              onChange={requirementFormik.handleChange}
              onBlur={requirementFormik.handleBlur}
              error={requirementFormik.touched.name && Boolean(requirementFormik.errors.name)}
              helperText={requirementFormik.touched.name && requirementFormik.errors.name}
            />
            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={2}
              value={requirementFormik.values.description}
              onChange={requirementFormik.handleChange}
              onBlur={requirementFormik.handleBlur}
            />
            <FormControlLabel
              control={
                <Switch
                  name="isRequired"
                  checked={requirementFormik.values.isRequired}
                  onChange={requirementFormik.handleChange}
                />
              }
              label="Required"
              sx={{ mt: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="acceptedMimeTypes"
              label="Accepted MIME Types (comma separated)"
              value={requirementFormik.values.acceptedMimeTypes}
              onChange={requirementFormik.handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="maxFileSizeMb"
              label="Max File Size (MB)"
              type="number"
              value={requirementFormik.values.maxFileSizeMb}
              onChange={requirementFormik.handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="sortOrder"
              label="Sort Order"
              type="number"
              value={requirementFormik.values.sortOrder}
              onChange={requirementFormik.handleChange}
            />
          </Box>
          {reqSubmitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {reqSubmitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReqDialogOpen(false)} disabled={reqSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => requirementFormik.handleSubmit()}
            variant="contained"
            disabled={reqSubmitting}
          >
            {reqSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingRequirement ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingQuestion ? "Edit Question" : "Create Question"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={questionFormik.handleSubmit} noValidate sx={{ pt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              name="question"
              label="Question"
              value={questionFormik.values.question}
              onChange={questionFormik.handleChange}
              onBlur={questionFormik.handleBlur}
              error={questionFormik.touched.question && Boolean(questionFormik.errors.question)}
              helperText={questionFormik.touched.question && questionFormik.errors.question}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={questionFormik.values.type}
                onChange={questionFormik.handleChange}
                label="Type"
              >
                <MenuItem value="yes_no">Yes/No</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="single_choice">Single Choice</MenuItem>
                <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  name="isRequired"
                  checked={questionFormik.values.isRequired}
                  onChange={questionFormik.handleChange}
                />
              }
              label="Required"
              sx={{ mt: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="sortOrder"
              label="Sort Order"
              type="number"
              value={questionFormik.values.sortOrder}
              onChange={questionFormik.handleChange}
            />
            {showQuestionOptions && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Options
                </Typography>
                {questionOptions.map((opt, idx) => (
                  <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {questionOptions.length > 1 && (
                      <IconButton size="small" onClick={() => handleRemoveOption(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddOption}>
                  Add Option
                </Button>
              </Box>
            )}
          </Box>
          {questionSubmitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {questionSubmitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)} disabled={questionSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => questionFormik.handleSubmit()}
            variant="contained"
            disabled={questionSubmitting}
          >
            {questionSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingQuestion ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={`Delete ${deletingItem?.type === "requirement" ? "Requirement" : "Question"}`}
        description={
          deletingItem
            ? `Are you sure you want to delete "${deletingItem.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingItem(null);
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