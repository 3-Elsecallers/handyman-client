'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Image from "next/image";

import { getProviderDocuments, verifyProvider, getDocumentDownloadUrl } from "@/api/admin.api";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip from "@/components/admin/StatusChip";
import type { ProviderProfile, ProviderDocument } from "@/types/admin";

const CATEGORY_LABELS: Record<string, string> = {
  selfie: "Selfie",
  ghana_card: "Ghana Card",
  additional: "Additional Document",
};

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingApproved, setPendingApproved] = useState(true);
  const [rejectionNote, setRejectionNote] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchProvider = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getProviderDocuments(id);
    if (response?.status === 200 && response.data.data) {
      setProvider(response.data.data);
      setDocuments(response.data.data.providerDocuments || []);
    } else {
      setError(response?.data?.message || "Failed to load provider details.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() { await fetchProvider(); }
    load();
  }, [fetchProvider]);

  const handleVerify = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await verifyProvider(id, pendingApproved, pendingApproved ? undefined : rejectionNote);
    if (response?.status === 200) {
      setActionSuccess(
        pendingApproved
          ? "Provider has been approved and verified."
          : "Provider has been rejected."
      );
      fetchProvider();
    } else {
      setActionError(response?.data?.message || "Action failed. Please try again.");
    }
    setActionLoading(false);
    setConfirmOpen(false);
    setRejectionNote("");
  };

  const openConfirm = (approved: boolean) => {
    setPendingApproved(approved);
    setActionError(null);
    setActionSuccess(null);
    setRejectionNote("");
    setConfirmOpen(true);
  };

  const handlePreview = async (documentId: string) => {
    setPreviewLoading(true);
    const response = await getDocumentDownloadUrl(documentId);
    if (response?.status === 200 && response.data.data?.url) {
      setPreviewUrl(response.data.data.url);
    }
    setPreviewLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !provider) {
    return (
      <Alert severity="error">
        {error || "Provider not found."}
      </Alert>
    );
  }

  const documentsByCategory = (category: string) =>
    documents.filter((d) => d.category === category);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/dashboard/providers")}
        sx={{ mb: 2 }}
      >
        Back to Providers
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Provider Details
      </Typography>

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Provider ID</Typography>
              <Typography>{provider.id}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">User ID</Typography>
              <Typography>{provider.userId}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <StatusChip status={provider.status} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Verified</Typography>
              <Chip
                label={provider.verified ? "Yes" : "No"}
                size="small"
                color={provider.verified ? "success" : "default"}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Verification Status</Typography>
              <Chip
                label={provider.verificationStatus.replace("_", " ")}
                size="small"
                color={
                  provider.verificationStatus === "approved" ? "success" :
                  provider.verificationStatus === "rejected" ? "error" :
                  provider.verificationStatus === "pending_review" ? "warning" :
                  "default"
                }
              />
            </Box>
            {provider.rejectionNote && (
              <Box>
                <Typography variant="body2" color="text.secondary">Rejection Note</Typography>
                <Typography color="error">{provider.rejectionNote}</Typography>
              </Box>
            )}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="body2" color="text.secondary">Bio</Typography>
              <Typography>{provider.bio || "—"}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
              <Typography>{provider.avgRating.toFixed(1)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Reviews</Typography>
              <Typography>{provider.totalReviews}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Jobs</Typography>
              <Typography>{provider.totalJobs}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
              <Typography>{(provider.completionRate * 100).toFixed(0)}%</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {provider.services && provider.services.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Services
            </Typography>
            {provider.services.map((service, index) => (
              <Box key={service.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2">
                      Service ID: {service.serviceId}
                    </Typography>
                    {service.customPrice !== null && (
                      <Typography variant="body2" color="text.secondary">
                        Custom Price: ${service.customPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={service.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={service.isActive ? "success" : "default"}
                  />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Documents
          </Typography>
          {documents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No documents submitted.
            </Typography>
          ) : (
            ["selfie", "ghana_card", "additional"].map((category) => {
              const docs = documentsByCategory(category);
              if (docs.length === 0) return null;
              return (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {CATEGORY_LABELS[category] || category}
                  </Typography>
                  {docs.map((doc) => (
                    <Box key={doc.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
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
                        onClick={() => handlePreview(doc.id)}
                        disabled={previewLoading}
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

      {previewUrl && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Document Preview</Typography>
              <Button onClick={() => setPreviewUrl(null)}>Close</Button>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Image
                src={previewUrl}
                alt="Document preview"
                width={800}
                height={600}
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
                unoptimized
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {provider.verificationStatus === "pending_review" && (
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={() => openConfirm(true)}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openConfirm(false)}
          >
            Reject
          </Button>
        </Box>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={pendingApproved ? "Approve Provider" : "Reject Provider"}
        description={
          pendingApproved
            ? "This will verify the provider and set their status to active. They will be notified of their approval."
            : "This will reject the provider and set their status to suspended. They will not be able to accept jobs."
        }
        confirmLabel={pendingApproved ? "Approve" : "Reject"}
        loading={actionLoading}
        onConfirm={handleVerify}
        onClose={() => setConfirmOpen(false)}
      >
        {!pendingApproved && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason (required)"
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        )}
      </ConfirmDialog>
    </Box>
  );
}
