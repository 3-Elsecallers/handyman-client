'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

import {
  getProviderDetail,
  getProviderIdentity,
  reviewIdentity,
  getProviderServiceList,
  getProviderServiceChecklist,
  reviewProviderService,
  getProviderReviews,
  getDocumentFile,
  reviewProviderDocument,
} from "@/api/admin.api";
import { listAllBookings, buildServiceNameMap } from "@/api/booking.api";
import { markNotificationsReadByContext } from "@/api/communication.api";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip from "@/components/admin/StatusChip";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type {
  ProviderDetail,
  ProviderDocument,
  ProviderIdentity,
  ProviderService,
  ProviderServiceChecklist,
  Review,
  VerificationStatus,
} from "@/types/admin";
import type { Booking } from "@/types/customer";

const CATEGORY_LABELS: Record<string, string> = {
  selfie: "Selfie",
  ghana_card: "Ghana Card",
  additional: "Additional Document",
};

function statusColor(status: string | undefined): "success" | "error" | "warning" | "default" {
  switch (status) {
    case "approved": return "success";
    case "rejected": return "error";
    case "pending_review": return "warning";
    default: return "default";
  }
}

function VerificationStatusChip({ status }: { status?: VerificationStatus }) {
  const label = (status ?? "not_submitted").replace(/_/g, " ");
  return <Chip label={label} size="small" color={statusColor(status)} />;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [identity, setIdentity] = useState<ProviderIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityConfirmOpen, setIdentityConfirmOpen] = useState(false);
  const [identityApproved, setIdentityApproved] = useState(true);
  const [identityRejectionNote, setIdentityRejectionNote] = useState("");

  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [reviewService, setReviewService] = useState<ProviderService | null>(null);
  const [serviceChecklist, setServiceChecklist] = useState<ProviderServiceChecklist | null>(null);
  const [serviceChecklistLoading, setServiceChecklistLoading] = useState(false);
  const [serviceConfirmOpen, setServiceConfirmOpen] = useState(false);
  const [serviceApproved, setServiceApproved] = useState(true);
  const [serviceRejectionNote, setServiceRejectionNote] = useState("");

  const [previewDocument, setPreviewDocument] = useState<{
    id: string;
    mimeType?: string;
    fileName?: string;
    status?: string;
  } | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});
  const [reviewTarget, setReviewTarget] = useState<{ documentId: string; name: string } | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [serviceNameMap, setServiceNameMap] = useState<Record<string, string>>({});
  const [highlightServiceId, setHighlightServiceId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProvider = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getProviderDetail(id);
    if (response?.status === 200 && response.data.data) {
      setProvider(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load provider details.");
    }
    setLoading(false);
  }, [id]);

  const fetchIdentity = useCallback(async () => {
    setIdentityLoading(true);
    const response = await getProviderIdentity(id);
    if (response?.status === 200 && response.data.data) {
      setIdentity(response.data.data);
    }
    setIdentityLoading(false);
  }, [id]);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    const response = await getProviderServiceList(id);
    if (response?.status === 200 && response.data.data) {
      setProviderServices(response.data.data);
    }
    setServicesLoading(false);
  }, [id]);

  const fetchReviews = useCallback(async (page: number) => {
    setReviewsLoading(true);
    const response = await getProviderReviews(id, { page, limit: 10 });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setReviews(data.reviews);
      setReviewsTotal(data.total);
      setReviewsTotalPages(data.totalPages);
    }
    setReviewsLoading(false);
  }, [id]);

  const fetchBookings = useCallback(async (page: number) => {
    setBookingsLoading(true);
    const response = await listAllBookings({ providerId: id, page, limit: 10 });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setBookings(data.items);
      setBookingsTotal(data.total);
      setBookingsTotalPages(data.pages);
    }
    setBookingsLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() {
      await Promise.all([
        fetchProvider(),
        fetchIdentity(),
        fetchServices(),
        fetchReviews(1),
        fetchBookings(1),
      ]);
      const names = await buildServiceNameMap();
      setServiceNameMap(names);
    }
    load();
  }, [fetchProvider, fetchIdentity, fetchServices, fetchReviews, fetchBookings]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Honor deep links from admin notifications (?tab=identity|services&service=).
  useEffect(() => {
    if (loading || !provider) return;
    const tab = searchParams.get("tab");
    if (tab !== "identity" && tab !== "services") return;

    const serviceId = searchParams.get("service");
    const timer = setTimeout(() => {
      const sectionId =
        tab === "identity" ? "identity-section" : "services-section";
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (!serviceId) return;
      setHighlightServiceId(serviceId);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(
        () => setHighlightServiceId(null),
        4000,
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, [loading, provider, searchParams]);

  const refreshAll = async () => {
    await Promise.all([fetchProvider(), fetchIdentity(), fetchServices()]);
  };

  const openIdentityConfirm = (approved: boolean) => {
    setIdentityApproved(approved);
    setIdentityRejectionNote("");
    setIdentityConfirmOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleIdentityConfirm = async () => {
    if (!identityApproved && !identityRejectionNote.trim()) return;
    setIdentityLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await reviewIdentity(
      id,
      identityApproved,
      identityApproved ? undefined : identityRejectionNote.trim(),
    );
    if (response?.status === 200) {
      setActionSuccess(
        identityApproved
          ? "Identity verification approved."
          : "Identity verification rejected."
      );
      setIdentityConfirmOpen(false);
      await refreshAll();
      await markNotificationsReadByContext({ providerId: id });
    } else {
      setActionError(response?.data?.message || "Action failed. Please try again.");
    }
    setIdentityLoading(false);
    setIdentityRejectionNote("");
  };

  const ensurePreviewUrl = useCallback(
    async (documentId: string) => {
      if (previewUrls[documentId]) return;
      setPreviewLoading((prev) => ({ ...prev, [documentId]: true }));
      const url = await getDocumentFile(documentId);
      if (url) {
        setPreviewUrls((prev) => ({ ...prev, [documentId]: url }));
      }
      setPreviewLoading((prev) => ({ ...prev, [documentId]: false }));
    },
    [previewUrls],
  );

  const openPreview = async (doc: { id: string; mimeType?: string; fileName?: string; status?: string }) => {
    setPreviewDocument(doc);
    await ensurePreviewUrl(doc.id);
  };

  const handleApproveDocument = async (documentId: string) => {
    setReviewLoading(true);
    const res = await reviewProviderDocument(documentId, { approved: true });
    if (res?.status === 200) {
      await refreshAll();
    }
    setReviewLoading(false);
  };

  const openRejectDialog = (documentId: string, name: string) => {
    setReviewTarget({ documentId, name });
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectDocument = async () => {
    if (!reviewTarget || !rejectReason.trim()) return;
    setReviewLoading(true);
    const res = await reviewProviderDocument(reviewTarget.documentId, {
      approved: false,
      rejectionReason: rejectReason.trim(),
    });
    if (res?.status === 200) {
      setRejectDialogOpen(false);
      setReviewTarget(null);
      await refreshAll();
    }
    setReviewLoading(false);
  };

  const closePreview = () => setPreviewDocument(null);

  const openServiceChecklist = async (service: ProviderService) => {
    setReviewService(service);
    setServiceChecklist(null);
    setServiceChecklistLoading(true);
    const response = await getProviderServiceChecklist(id, service.id);
    if (response?.status === 200 && response.data.data) {
      setServiceChecklist(response.data.data);
    }
    setServiceChecklistLoading(false);
  };

  const closeServiceChecklist = () => {
    setReviewService(null);
    setServiceChecklist(null);
  };

  const openServiceConfirm = (approved: boolean) => {
    setServiceApproved(approved);
    setServiceRejectionNote("");
    setServiceConfirmOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleServiceConfirm = async () => {
    if (!reviewService) return;
    if (!serviceApproved && !serviceRejectionNote.trim()) return;
    setServiceChecklistLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await reviewProviderService(
      id,
      reviewService.id,
      serviceApproved,
      serviceApproved ? undefined : serviceRejectionNote.trim(),
    );
    if (response?.status === 200) {
      setActionSuccess(
        serviceApproved
          ? `"${reviewService.service?.name ?? "Service"}" approved and activated.`
          : `"${reviewService.service?.name ?? "Service"}" rejected.`
      );
      setServiceConfirmOpen(false);
      setServiceChecklist(null);
      await refreshAll();
      await markNotificationsReadByContext({
        providerId: id,
        providerServiceId: reviewService.id,
      });
    } else {
      setActionError(response?.data?.message || "Action failed. Please try again.");
    }
    setServiceChecklistLoading(false);
    setServiceRejectionNote("");
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

  const reviewColumns: AdminTableColumn<Review>[] = [
    {
      label: "Rating",
      render: (row) => `${"★".repeat(row.rating)}${"☆".repeat(5 - row.rating)}`,
    },
    {
      label: "Comment",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 250, display: "block" }}>
          {row.comment || "—"}
        </Typography>
      ),
    },
    { label: "Customer", key: "customerId" },
    {
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const bookingColumns: AdminTableColumn<Booking>[] = [
    {
      label: "Service",
      render: (row) => (
        <Typography noWrap sx={{ maxWidth: 220, display: "block" }}>
          {serviceNameMap[row.serviceId] || row.serviceId}
        </Typography>
      ),
    },
    { label: "Type", render: (row) => row.type },
    {
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      label: "Scheduled",
      render: (row) =>
        row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—",
    },
    {
      label: "Price",
      render: (row) => `₵${row.priceQuote.toFixed(2)}`,
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const renderDocRow = (doc: ProviderDocument, name: string) => (
    <Box key={doc.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
      <Chip label={statusLabel(doc.status)} size="small" color={statusColor(doc.status)} />
      <Typography variant="body2">{name}</Typography>
      <Button size="small" startIcon={<VisibilityIcon />} onClick={() => openPreview({ id: doc.id, mimeType: doc.mimeType, fileName: doc.fileName, status: doc.status })} disabled={Boolean(previewLoading[doc.id])}>View</Button>
      {doc.status === "pending_review" && (
        <>
          <Button size="small" color="success" startIcon={<CheckCircleIcon />} disabled={reviewLoading} onClick={() => handleApproveDocument(doc.id)}>Approve</Button>
          <Button size="small" color="error" startIcon={<CancelIcon />} disabled={reviewLoading} onClick={() => openRejectDialog(doc.id, name)}>Reject</Button>
        </>
      )}
      {doc.status === "rejected" && doc.rejectionReason && (
        <Typography variant="caption" color="error">— {doc.rejectionReason}</Typography>
      )}
    </Box>
  );

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
        {provider.user ? `${provider.user.firstName} ${provider.user.lastName}` : "Provider Details"}
      </Typography>
      {provider.competencyTier && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Chip
            size="small"
            label={`${provider.competencyTier} tier`}
            color={provider.competencyTier === "master" ? "primary" : provider.competencyTier === "journeyman" ? "info" : "default"}
          />
          <Chip
            size="small"
            label={provider.qualityGrade}
            color={provider.qualityGrade === "platinum" ? "primary" : provider.qualityGrade === "gold" ? "warning" : provider.qualityGrade === "silver" ? "secondary" : "default"}
          />
        </Box>
      )}

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
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {provider.id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">User ID</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {provider.userId}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <StatusChip status={provider.status} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Service Area</Typography>
              <Typography>{provider.serviceAreaRadiusKm} km</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Created</Typography>
              <Typography>{new Date(provider.createdAt).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="body2" color="text.secondary">Bio</Typography>
              <Typography>{provider.bio || "—"}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {provider.user && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                src={provider.user.avatarUrl ?? undefined}
                alt={`${provider.user.firstName} ${provider.user.lastName}`}
                sx={{ width: 72, height: 72, fontSize: 28 }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {provider.user.firstName} {provider.user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {provider.user.email}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography>{provider.user.email}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography>{provider.user.phone || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Joined</Typography>
                <Typography>{new Date(provider.user.createdAt).toLocaleDateString()}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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

      <Card variant="outlined" sx={{ mb: 3, scrollMarginTop: 88 }} id="identity-section">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1 — Identity Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The provider&apos;s identity (selfie, Ghana Card, additional documents) is reviewed
            here before any service can be activated.
          </Typography>

          {identityLoading && !identity ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <VerificationStatusChip status={identity?.identityStatus} />
              </Box>

              {identity?.identityStatus === "rejected" && identity.identityRejectionNote && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Rejection Reason:</Typography>
                  {identity.identityRejectionNote}
                </Alert>
              )}

              {(identity?.documents || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No identity documents uploaded yet.
                </Typography>
              ) : (
                identity?.documents.map((doc) =>
                  renderDocRow(doc, CATEGORY_LABELS[doc.category] || doc.category)
                )
              )}

              {identity?.identityStatus === "pending_review" && (
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    disabled={identityLoading}
                    onClick={() => openIdentityConfirm(true)}
                  >
                    Approve Identity
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={identityLoading}
                    onClick={() => openIdentityConfirm(false)}
                  >
                    Reject Identity
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3, scrollMarginTop: 88 }} id="services-section">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 2 — Service Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Each service must be verified separately against its category requirements before it
            can be booked by customers.
          </Typography>

          {servicesLoading && providerServices.length === 0 ? (
            <CircularProgress size={24} />
          ) : providerServices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              This provider has not added any services yet.
            </Typography>
          ) : (
            providerServices.map((service, index) => (
              <Box key={service.id} id={`service-row-${service.id}`}>
                {index > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    borderRadius: 1,
                    outline:
                      highlightServiceId === service.id
                        ? "2px solid"
                        : "none",
                    outlineColor: "primary.main",
                    backgroundColor:
                      highlightServiceId === service.id
                        ? "action.hover"
                        : "transparent",
                    p: highlightServiceId === service.id ? 1 : undefined,
                    transition: "outline-color 300ms, background-color 300ms",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {service.service?.name || service.serviceId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.service?.category?.name || ""}
                      {service.customPrice !== null && (
                        <> — Custom Price: ₵{service.customPrice.toFixed(2)}</>
                      )}
                    </Typography>
                    {service.status === "rejected" && service.rejectionNote && (
                      <Typography variant="caption" color="error">— {service.rejectionNote}</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VerificationStatusChip status={service.status} />
                    <Chip
                      label={service.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={service.isActive ? "success" : "default"}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => openServiceChecklist(service)}
                    >
                      Review
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))
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
              {previewDocument.fileName || "Document"}
            </Typography>
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogTitle>
          <DialogContent sx={{ position: "relative", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {previewLoading[previewDocument.id] && <CircularProgress sx={{ color: "text.primary" }} />}
            {!previewLoading[previewDocument.id] && previewUrls[previewDocument.id] && (
              previewDocument.mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrls[previewDocument.id]}
                  title={previewDocument.fileName}
                  style={{ width: "100%", height: "70vh", border: "none", borderRadius: 4 }}
                />
              ) : (
                <img
                  src={previewUrls[previewDocument.id]}
                  alt={previewDocument.fileName}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 4 }}
                />
              )
            )}
            {!previewLoading[previewDocument.id] && !previewUrls[previewDocument.id] && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.secondary" }}>
                <ImageNotSupportedIcon />
                <Typography variant="body2">Unable to load this document.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Chip
              size="small"
              label={statusLabel(previewDocument.status || "unknown")}
              color={statusColor(previewDocument.status)}
            />
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {rejectDialogOpen && reviewTarget && (
        <Dialog open onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Document: {reviewTarget.name}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejecting this document..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={!rejectReason.trim() || reviewLoading}
              onClick={handleRejectDocument}
            >
              Reject
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {reviewService && (
        <Dialog open maxWidth="md" fullWidth onClose={closeServiceChecklist}>
          <DialogTitle>
            Review Service: {reviewService.service?.name || reviewService.serviceId}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <VerificationStatusChip status={serviceChecklist?.status ?? reviewService.status} />
              {serviceChecklist?.identityApproved === false && (
                <Chip label="Identity not approved" size="small" color="error" />
              )}
            </Box>

            {serviceChecklistLoading && !serviceChecklist ? (
              <CircularProgress size={24} />
            ) : serviceChecklist ? (
              <>
                {serviceChecklist.status === "rejected" && serviceChecklist.rejectionNote && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Rejection Reason:</Typography>
                    {serviceChecklist.rejectionNote}
                  </Alert>
                )}

                {serviceChecklist.requirements.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Requirements</Typography>
                    {serviceChecklist.requirements.map((req) => (
                      <Box key={req.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                        <Chip label={statusLabel(req.status)} size="small" color={statusColor(req.status)} />
                        <Typography variant="body2">{req.name}</Typography>
                        {req.isRequired && <Chip label="Required" size="small" variant="outlined" />}
                        {req.type === "attestation" && req.answer && (
                          <Typography variant="caption" color="text.secondary">— &ldquo;{req.answer}&rdquo;</Typography>
                        )}
                        {req.documentId && (
                          <>
                            <Button size="small" startIcon={<VisibilityIcon />} onClick={() => openPreview({ id: req.documentId!, mimeType: req.mimeType, fileName: req.fileName, status: req.status })} disabled={Boolean(previewLoading[req.documentId])}>View</Button>
                            {req.status === "pending_review" && (
                              <>
                                <Button size="small" color="success" startIcon={<CheckCircleIcon />} disabled={reviewLoading} onClick={() => handleApproveDocument(req.documentId!)}>Approve</Button>
                                <Button size="small" color="error" startIcon={<CancelIcon />} disabled={reviewLoading} onClick={() => openRejectDialog(req.documentId!, req.name)}>Reject</Button>
                              </>
                            )}
                          </>
                        )}
                        {req.status === "rejected" && req.rejectionReason && (
                          <Typography variant="caption" color="error">— {req.rejectionReason}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {serviceChecklist.serviceRequirements.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Service-Specific Requirements</Typography>
                    {serviceChecklist.serviceRequirements.map((req) => (
                      <Box key={req.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                        <Chip label={statusLabel(req.status)} size="small" color={statusColor(req.status)} />
                        <Typography variant="body2">{req.name}</Typography>
                        {req.isRequired && <Chip label="Required" size="small" variant="outlined" />}
                        {req.type === "attestation" && req.answer && (
                          <Typography variant="caption" color="text.secondary">— &ldquo;{req.answer}&rdquo;</Typography>
                        )}
                        {req.documentId && (
                          <>
                            <Button size="small" startIcon={<VisibilityIcon />} onClick={() => openPreview({ id: req.documentId!, mimeType: req.mimeType, fileName: req.fileName, status: req.status })} disabled={Boolean(previewLoading[req.documentId])}>View</Button>
                            {req.status === "pending_review" && (
                              <>
                                <Button size="small" color="success" startIcon={<CheckCircleIcon />} disabled={reviewLoading} onClick={() => handleApproveDocument(req.documentId!)}>Approve</Button>
                                <Button size="small" color="error" startIcon={<CancelIcon />} disabled={reviewLoading} onClick={() => openRejectDialog(req.documentId!, req.name)}>Reject</Button>
                              </>
                            )}
                          </>
                        )}
                        {req.status === "rejected" && req.rejectionReason && (
                          <Typography variant="caption" color="error">— {req.rejectionReason}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {serviceChecklist.questions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Questionnaire</Typography>
                    {serviceChecklist.questions.map((q) => (
                      <Box key={q.id} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{q.question}</Typography>
                        <Typography variant="body2">{q.answer || "—"}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {serviceChecklist.serviceQuestions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Service-Specific Questions</Typography>
                    {serviceChecklist.serviceQuestions.map((q) => (
                      <Box key={q.id} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{q.question}</Typography>
                        <Typography variant="body2">{q.answer || "—"}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Could not load checklist for this service.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeServiceChecklist}>Close</Button>
            {serviceChecklist?.status === "pending_review" && (
              <>
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  disabled={serviceChecklistLoading || serviceChecklist.identityApproved === false}
                  onClick={() => openServiceConfirm(true)}
                >
                  Approve Service
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  disabled={serviceChecklistLoading}
                  onClick={() => openServiceConfirm(false)}
                >
                  Reject Service
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {serviceConfirmOpen && reviewService && (
        <Dialog open onClose={() => setServiceConfirmOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {serviceApproved ? "Approve Service" : "Reject Service"}: {reviewService.service?.name}
          </DialogTitle>
          <DialogContent>
            {serviceApproved ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Approving this service makes it bookable by customers.
              </Alert>
            ) : (
              <TextField
                autoFocus
                fullWidth
                multiline
                rows={3}
                label="Rejection Reason (required)"
                value={serviceRejectionNote}
                onChange={(e) => setServiceRejectionNote(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setServiceConfirmOpen(false)}>Cancel</Button>
            <Button
              color={serviceApproved ? "success" : "error"}
              variant="contained"
              disabled={serviceChecklistLoading || (!serviceApproved && !serviceRejectionNote.trim())}
              onClick={handleServiceConfirm}
            >
              {serviceApproved ? "Approve" : "Reject"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reviews
          </Typography>
          <AdminTable
            columns={reviewColumns}
            rows={reviews}
            loading={reviewsLoading}
            emptyMessage="No reviews yet."
            rowKey={(row) => row.id}
          />
          {reviewsTotal > 10 && (
            <AdminPagination
              page={reviewsPage}
              totalPages={reviewsTotalPages}
              total={reviewsTotal}
              pageSize={10}
              onPageChange={(p) => {
                setReviewsPage(p);
                fetchReviews(p);
              }}
              onPageSizeChange={() => {}}
            />
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Booking History
          </Typography>
          <AdminTable
            columns={bookingColumns}
            rows={bookings}
            loading={bookingsLoading}
            emptyMessage="No bookings for this provider yet."
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/dashboard/bookings/${row.id}`)}
          />
          {bookingsTotal > 10 && (
            <Box sx={{ mt: 2 }}>
              <AdminPagination
                page={bookingsPage}
                totalPages={bookingsTotalPages}
                total={bookingsTotal}
                pageSize={10}
                onPageChange={(p) => {
                  setBookingsPage(p);
                  fetchBookings(p);
                }}
                onPageSizeChange={() => {}}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={identityConfirmOpen}
        title={identityApproved ? "Approve Identity" : "Reject Identity"}
        description={
          identityApproved
            ? "This will approve the provider's identity (Step 1). Make sure all identity documents are approved first."
            : "This will reject the provider's identity (Step 1). They will not be able to get any services approved until identity is re-approved."
        }
        confirmLabel={identityApproved ? "Approve" : "Reject"}
        loading={identityLoading}
        onConfirm={handleIdentityConfirm}
        onClose={() => setIdentityConfirmOpen(false)}
      >
        {!identityApproved && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason (required)"
            value={identityRejectionNote}
            onChange={(e) => setIdentityRejectionNote(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        )}
      </ConfirmDialog>
    </Box>
  );
}
