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
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { getUserDetail, updateUserStatus } from "@/api/admin.api";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { UserDetail } from "@/types/admin";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"suspend" | "activate">("suspend");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getUserDetail(id);
    if (response?.status === 200 && response.data.data) {
      setUser(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load user details.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() { await fetchUser(); }
    load();
  }, [fetchUser]);

  const handleStatusAction = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await updateUserStatus(id, pendingAction);
    if (response?.status === 200) {
      setActionSuccess(
        pendingAction === "suspend"
          ? "User has been suspended."
          : "User has been activated."
      );
      fetchUser();
    } else {
      setActionError(response?.data?.message || "Action failed. Please try again.");
    }
    setActionLoading(false);
    setConfirmOpen(false);
  };

  const openConfirm = (action: "suspend" | "activate") => {
    setPendingAction(action);
    setActionError(null);
    setActionSuccess(null);
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Alert severity="error">
        {error || "User not found."}
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/dashboard/customers")}
        sx={{ mb: 2 }}
      >
        Back to Customers
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        {user.firstName} {user.lastName}
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
            Account Details
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography>{user.email}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Typography>{user.phone || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Role</Typography>
              <Chip label={user.role} size="small" variant="outlined" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Email Verified</Typography>
              <Chip
                label={user.emailVerified ? "Yes" : "No"}
                size="small"
                color={user.emailVerified ? "success" : "default"}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Phone Verified</Typography>
              <Chip
                label={user.phoneVerified ? "Yes" : "No"}
                size="small"
                color={user.phoneVerified ? "success" : "default"}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Created</Typography>
              <Typography>{new Date(user.createdAt).toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Last Updated</Typography>
              <Typography>{new Date(user.updatedAt).toLocaleString()}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => openConfirm("suspend")}
        >
          Suspend User
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={() => openConfirm("activate")}
        >
          Activate User
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction === "suspend" ? "Suspend User" : "Activate User"}
        description={
          pendingAction === "suspend"
            ? `Are you sure you want to suspend ${user.firstName} ${user.lastName}? This will notify the system to restrict their access.`
            : `Are you sure you want to activate ${user.firstName} ${user.lastName}?`
        }
        confirmLabel={pendingAction === "suspend" ? "Suspend" : "Activate"}
        loading={actionLoading}
        onConfirm={handleStatusAction}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
