'use client';

import { useCallback, useEffect, useRef, useState } from "react";

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
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import MuiIconButton from "@mui/material/IconButton";

import { getMyIdentity, requestDocumentUploadUrls, confirmDocumentUploads, getDocumentDownloadUrl } from "@/api/provider.api";
import type { ProviderIdentity, ProviderDocument, DocumentCategory } from "@/types/provider";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  selfie: "Selfie",
  ghana_card: "Ghana Card",
  additional: "Additional Document",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PendingFile {
  file: File;
  category: DocumentCategory;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
  documentId?: string;
}

export default function ProviderDocumentsPage() {
  const [identity, setIdentity] = useState<ProviderIdentity | null>(null);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("selfie");
  const [previewDocument, setPreviewDocument] = useState<ProviderDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getMyIdentity();
    if (res?.status === 200 && res.data.data) {
      setIdentity(res.data.data);
      setDocuments(res.data.data.documents || []);
    } else {
      setError("Failed to load identity verification.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`;
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPending: PendingFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      newPending.push({
        file,
        category: selectedCategory,
        progress: 0,
        status: validationError ? "error" : "pending",
        error: validationError || undefined,
      });
    }

    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validFiles = pendingFiles.filter((f) => f.status === "pending");
    if (validFiles.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const filesMetadata = validFiles.map((f) => ({
        fileName: f.file.name,
        fileSize: f.file.size,
        mimeType: f.file.type,
        category: f.category,
      }));

      const urlsRes = await requestDocumentUploadUrls(filesMetadata);
      if (urlsRes?.status !== 200 || !urlsRes?.data?.data) {
        setSubmitError("Failed to get upload URLs. Please try again.");
        setSubmitting(false);
        return;
      }

      const uploadItems = urlsRes.data.data;
      const uploadedIds: string[] = [];

      for (let i = 0; i < uploadItems.length; i++) {
        const item = uploadItems[i];
        const pendingIndex = pendingFiles.findIndex(
          (f) => f.status === "pending" && f.file.name === item.fileName,
        );
        if (pendingIndex === -1) continue;

        const file = pendingFiles[pendingIndex].file;

        setPendingFiles((prev) =>
          prev.map((f, idx) =>
            idx === pendingIndex ? { ...f, status: "uploading" as const, progress: 0 } : f,
          ),
        );

        try {
          const xhr = new XMLHttpRequest();
          const uploadPromise = new Promise<void>((resolve, reject) => {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setPendingFiles((prev) =>
                  prev.map((f, idx) =>
                    idx === pendingIndex ? { ...f, progress } : f,
                  ),
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error("Upload failed"));
          });

          xhr.open("PUT", item.uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);

          await uploadPromise;

          uploadedIds.push(item.id);
          setPendingFiles((prev) =>
            prev.map((f, idx) =>
              idx === pendingIndex ? { ...f, status: "uploaded" as const, progress: 100, documentId: item.id } : f,
            ),
          );
        } catch (err) {
          setPendingFiles((prev) =>
            prev.map((f, idx) =>
              idx === pendingIndex
                ? { ...f, status: "error" as const, error: err instanceof Error ? err.message : "Upload failed" }
                : f,
            ),
          );
        }
      }

      if (uploadedIds.length > 0) {
        const confirmRes = await confirmDocumentUploads(uploadedIds);
        if (confirmRes?.status === 200) {
          setSubmitSuccess("Documents uploaded and submitted for review successfully.");
          setPendingFiles((prev) => prev.filter((f) => f.status !== "uploaded"));
          fetchData();
        } else {
          setSubmitError("Documents uploaded but failed to submit for review. Please try again.");
        }
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    }

    setSubmitting(false);
  };

  const getVerificationStatusColor = () => {
    switch (identity?.identityStatus) {
      case "approved": return "success";
      case "rejected": return "error";
      case "pending_review": return "warning";
      default: return "default";
    }
  };

  const getVerificationStatusLabel = () => {
    switch (identity?.identityStatus) {
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "pending_review": return "Pending Review";
      default: return "Not Submitted";
    }
  };

  const documentsByCategory = (category: DocumentCategory) =>
    documents.filter((d) => d.category === category);

  const openPreview = async (doc: ProviderDocument) => {
    setPreviewDocument(doc);
    setPreviewLoading(true);
    const res = await getDocumentDownloadUrl(doc.id);
    if (res?.status === 200 && res.data.data?.url) {
      setPreviewUrl(res.data.data.url);
    } else {
      setPreviewUrl(null);
    }
    setPreviewLoading(false);
  };

  const closePreview = () => {
    setPreviewDocument(null);
    setPreviewUrl(null);
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
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Identity Verification
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Step 1 of 2: Verify your identity with a selfie and government-issued photo ID (Ghana Card).
        An admin must approve your identity before your services can be activated.
      </Typography>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
          {submitSuccess}
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verification Status
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Chip
              label={getVerificationStatusLabel()}
              color={getVerificationStatusColor() as "success" | "error" | "warning" | "default"}
              icon={
                identity?.identityStatus === "approved" ? <CheckCircleIcon /> :
                identity?.identityStatus === "rejected" ? <ErrorIcon /> :
                identity?.identityStatus === "pending_review" ? <HourglassEmptyIcon /> :
                undefined
              }
            />
          </Box>
          {identity?.identityStatus === "rejected" && identity.identityRejectionNote && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Rejection Reason:</Typography>
              {identity.identityRejectionNote}
            </Alert>
          )}
          {identity?.identityStatus === "approved" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your identity has been verified. You can now complete service requirements.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload clear photos of your documents. Accepted formats: JPEG, PNG, WebP. Max size: 5MB per file.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Document Category
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                  <Chip
                    key={cat}
                    label={CATEGORY_LABELS[cat]}
                    onClick={() => setSelectedCategory(cat)}
                    color={selectedCategory === cat ? "primary" : "default"}
                    variant={selectedCategory === cat ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              Select Files
            </Button>
          </Box>

          {pendingFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({pendingFiles.length})
              </Typography>
              {pendingFiles.map((pf, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {pf.file.name} ({(pf.file.size / 1024 / 1024).toFixed(1)}MB)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {CATEGORY_LABELS[pf.category]}
                      </Typography>
                    </Box>
                    {pf.status === "error" && (
                      <Typography variant="caption" color="error">
                        {pf.error}
                      </Typography>
                    )}
                    {pf.status === "uploaded" && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                    {pf.status === "uploading" && (
                      <CircularProgress size={20} />
                    )}
                    <MuiIconButton onClick={() => removePendingFile(index)} size="small">
                      <DeleteIcon fontSize="small" />
                    </MuiIconButton>
                  </Box>
                  {pf.status === "uploading" && (
                    <LinearProgress variant="determinate" value={pf.progress} sx={{ mt: 0.5 }} />
                  )}
                  {index < pendingFiles.length - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={submitting || pendingFiles.every((f) => f.status !== "pending")}
                sx={{ mt: 1 }}
              >
                {submitting ? <CircularProgress size={24} /> : "Upload & Submit for Review"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Submitted Documents
          </Typography>
          {documents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No documents submitted yet.
            </Typography>
          ) : (
            (["selfie", "ghana_card", "additional"] as DocumentCategory[]).map((category) => {
              const docs = documentsByCategory(category);
              if (docs.length === 0) return null;
              return (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {CATEGORY_LABELS[category]}
                  </Typography>
                  {docs.map((doc) => (
                    <Box key={doc.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Chip
                        label={doc.status.replace("_", " ")}
                        size="small"
                        color={
                          doc.status === "approved" ? "success" :
                          doc.status === "rejected" ? "error" :
                          doc.status === "pending_review" ? "warning" :
                          "default"
                        }
                      />
                      <Typography variant="body2">{doc.fileName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({(doc.fileSize / 1024 / 1024).toFixed(1)}MB)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => openPreview(doc)}
                      >
                        View
                      </Button>
                      {doc.status === "rejected" && doc.rejectionReason && (
                        <Typography variant="caption" color="error">
                          - {doc.rejectionReason}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {category !== "additional" && <Divider sx={{ mt: 1 }} />}
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>

      {previewDocument && (
        <Dialog
          open
          onClose={closePreview}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: { backgroundColor: "#111" } } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              {previewDocument.fileName}
            </Typography>
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogTitle>
          <DialogContent sx={{ position: "relative", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {previewLoading && <CircularProgress sx={{ color: "text.primary" }} />}
            {!previewLoading && previewUrl && (
              previewDocument.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title={previewDocument.fileName}
                  style={{ width: "100%", height: "70vh", border: "none", borderRadius: 4 }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewDocument.fileName}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 4 }}
                />
              )
            )}
            {!previewLoading && !previewUrl && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.secondary" }}>
                <ImageNotSupportedIcon />
                <Typography variant="body2">Unable to load this document.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Chip
              size="small"
              label={previewDocument.status.replace("_", " ")}
              color={
                previewDocument.status === "approved" ? "success" :
                previewDocument.status === "rejected" ? "error" :
                previewDocument.status === "pending_review" ? "warning" :
                "default"
              }
            />
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
