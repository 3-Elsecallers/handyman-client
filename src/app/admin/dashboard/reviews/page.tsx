'use client';

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { getFlaggedReviews, moderateReview } from "@/api/admin.api";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusChip from "@/components/admin/StatusChip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { Review, ReviewStatus } from "@/types/admin";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingModeration, setPendingModeration] = useState<{ id: string; status: ReviewStatus } | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getFlaggedReviews({ page, limit: pageSize });
    if (response?.status === 200 && response.data.data) {
      const data = response.data.data;
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      setError(response?.data?.message || "Failed to load reviews.");
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    async function load() { await fetchReviews(); }
    load();
  }, [fetchReviews]);

  const openModerationConfirm = (id: string, status: ReviewStatus) => {
    setPendingModeration({ id, status });
    setActionError(null);
    setActionSuccess(null);
    setConfirmOpen(true);
  };

  const handleModerate = async () => {
    if (!pendingModeration) return;
    setActionLoading(true);
    setActionError(null);
    const response = await moderateReview(pendingModeration.id, pendingModeration.status);
    if (response?.status === 200) {
      setActionSuccess(`Review has been set to "${pendingModeration.status}".`);
      fetchReviews();
    } else {
      setActionError(response?.data?.message || "Moderation failed. Please try again.");
    }
    setActionLoading(false);
    setConfirmOpen(false);
    setPendingModeration(null);
  };

  const moderationLabels: Record<ReviewStatus, string> = {
    visible: "Approve",
    flagged: "Flag",
    removed: "Remove",
  };

  const columns: AdminTableColumn<Review>[] = [
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
    { label: "Provider", key: "providerId" },
    {
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {row.status !== "visible" && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                openModerationConfirm(row.id, "visible");
              }}
            >
              Approve
            </Button>
          )}
          {row.status !== "flagged" && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={(e) => {
                e.stopPropagation();
                openModerationConfirm(row.id, "flagged");
              }}
            >
              Flag
            </Button>
          )}
          {row.status !== "removed" && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                openModerationConfirm(row.id, "removed");
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Review Moderation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Flagged reviews requiring moderation appear below.
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AdminTable
        columns={columns}
        rows={reviews}
        loading={loading}
        emptyMessage="No flagged reviews."
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

      <ConfirmDialog
        open={confirmOpen}
        title={pendingModeration ? moderationLabels[pendingModeration.status] : "Moderate Review"}
        description={
          pendingModeration
            ? `Are you sure you want to set this review to "${pendingModeration.status}"?`
            : ""
        }
        confirmLabel={pendingModeration ? moderationLabels[pendingModeration.status] : "Confirm"}
        loading={actionLoading}
        onConfirm={handleModerate}
        onClose={() => {
          setConfirmOpen(false);
          setPendingModeration(null);
        }}
      />
    </Box>
  );
}
