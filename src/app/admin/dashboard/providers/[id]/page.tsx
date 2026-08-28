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
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

import { getProviderDetail, verifyProvider, getDocumentFile, getProviderReviews } from "@/api/admin.api";
import { listAllBookings, buildServiceNameMap } from "@/api/booking.api";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip from "@/components/admin/StatusChip";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { ProviderDetail, ProviderDocument, Review } from "@/types/admin";
import type { Booking } from "@/types/customer";

const CATEGORY_LABELS: Record<string, string> = {
  selfie: "Selfie",
  ghana_card: "Ghana Card",
  additional: "Additional Document",
};

function statusColor(status: string): "success" | "error" | "warning" | "default" {
  switch (status) {
    case "approved": return "success";
    case "rejected": return "error";
    case "pending_review": return "warning";
    default: return "default";
  }
}

function docStatusLabel(status: string): string {
  return status.replace("_", " ");
}

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingApproved, setPendingApproved] = useState(true);
  const [rejectionNote, setRejectionNote] = useState("");
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

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
      await fetchProvider();
      await fetchReviews(1);
      await fetchBookings(1);
      const names = await buildServiceNameMap();
      setServiceNameMap(names);
    }
    load();
  }, [fetchProvider, fetchReviews, fetchBookings]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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

  const carouselDocuments = provider?.providerDocuments || [];

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

  const openCarousel = (documentId: string) => {
    const index = carouselDocuments.findIndex((d) => d.id === documentId);
    setCarouselIndex(index >= 0 ? index : 0);
    ensurePreviewUrl(documentId);
  };

  const closeCarousel = () => setCarouselIndex(null);

  const stepCarousel = (delta: number) => {
    setCarouselIndex((current) => {
      if (current === null || carouselDocuments.length === 0) return current;
      const next = (current + delta + carouselDocuments.length) % carouselDocuments.length;
      ensurePreviewUrl(carouselDocuments[next].id);
      return next;
    });
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
    (provider.providerDocuments || []).filter((d) => d.category === category);

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
              <Typography variant="body2" color="text.secondary">Verified</Typography>
              <Chip
                label={provider.verified ? "Yes" : "No"}
                size="small"
                color={provider.verified ? "success" : "default"}
              />
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography>{provider.user.firstName} {provider.user.lastName}</Typography>
              </Box>
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

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verification
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Verification Status</Typography>
              <StatusChip status={provider.verificationStatus} />
            </Box>
            {provider.rejectionNote && (
              <Box>
                <Typography variant="body2" color="text.secondary">Rejection Note</Typography>
                <Typography color="error">{provider.rejectionNote}</Typography>
              </Box>
            )}
          </Box>
          {provider.verificationStatus === "pending_review" && (
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Documents
          </Typography>
          {!provider.providerDocuments || provider.providerDocuments.length === 0 ? (
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
                  {docs.map((doc: ProviderDocument) => (
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
                        onClick={() => openCarousel(doc.id)}
                        disabled={Boolean(previewLoading[doc.id])}
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

      {carouselIndex !== null && carouselDocuments.length > 0 && (
        <Dialog
          open
          onClose={closeCarousel}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: { backgroundColor: "#111" } } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              {CATEGORY_LABELS[carouselDocuments[carouselIndex].category] || carouselDocuments[carouselIndex].category}
              {" "}
              <Box component="span" sx={{ fontWeight: 400, opacity: 0.7 }}>
                ({carouselIndex + 1} of {carouselDocuments.length})
              </Box>
            </Typography>
            <Button onClick={closeCarousel} color="inherit" size="small">
              Close
            </Button>
          </DialogTitle>
          <DialogContent sx={{ position: "relative", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {carouselIndex > 0 && (
              <IconButton
                onClick={() => stepCarousel(-1)}
                sx={{ position: "absolute", left: 8, zIndex: 2, color: "text.primary", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}
              >
                <ChevronLeftIcon />
              </IconButton>
            )}
            {carouselIndex < carouselDocuments.length - 1 && (
              <IconButton
                onClick={() => stepCarousel(1)}
                sx={{ position: "absolute", right: 8, zIndex: 2, color: "text.primary", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}
              >
                <ChevronRightIcon />
              </IconButton>
            )}
            {(() => {
              const doc = carouselDocuments[carouselIndex];
              const docUrl = previewUrls[doc.id];
              const loading = Boolean(previewLoading[doc.id]);
              return (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%", py: 2 }}>
                  <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.8 }}>
                    {doc.fileName}
                  </Typography>
                  {loading && <CircularProgress sx={{ color: "text.primary" }} />}
                  {!loading && docUrl && (
                    <img
                      src={docUrl}
                      alt={doc.fileName}
                      style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 4 }}
                    />
                  )}
                  {!loading && !docUrl && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.secondary" }}>
                      <ImageNotSupportedIcon />
                      <Typography variant="body2">Unable to load this document.</Typography>
                    </Box>
                  )}
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Chip
              size="small"
              label={docStatusLabel(carouselDocuments[carouselIndex].status)}
              color={statusColor(carouselDocuments[carouselIndex].status)}
            />
            <Button onClick={closeCarousel} color="inherit" size="small">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
                      {service.service?.name || service.serviceId}
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
