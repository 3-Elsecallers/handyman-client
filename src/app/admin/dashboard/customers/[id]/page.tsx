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
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { getUserDetail, updateUserStatus } from "@/api/admin.api";
import { buildServiceNameMap, listAllBookings } from "@/api/booking.api";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import PaymentStatusChip from "@/components/admin/PaymentStatusChip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatusChip from "@/components/admin/StatusChip";
import type { UserDetail } from "@/types/admin";
import type { Booking } from "@/types/customer";

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

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getUserDetail(id);
    if (response?.status === 200 && response.data.data) {
      setUser(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load customer details.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() { await fetchUser(); }
    load();
  }, [fetchUser]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    const response = await listAllBookings({ customerId: id, limit: 20 });
    if (response?.status === 200 && response.data.data) {
      setBookings(response.data.data.items);
    } else {
      setBookingsError(response?.data?.message || "Failed to load booking history.");
    }
    setBookingsLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() {
      const nameMap = await buildServiceNameMap();
      setServiceMap(nameMap);
    }
    load();
  }, []);

  useEffect(() => {
    async function load() { await fetchBookings(); }
    load();
  }, [fetchBookings]);

  const handleStatusAction = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await updateUserStatus(id, pendingAction);
    if (response?.status === 200) {
      setActionSuccess(
        pendingAction === "suspend"
          ? "Customer has been suspended."
          : "Customer has been activated."
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
        {error || "Customer not found."}
      </Alert>
    );
  }

  const bookingColumns: AdminTableColumn<Booking>[] = [
    {
      label: "Service",
      render: (row) => serviceMap[row.serviceId] || row.service?.name || row.serviceId,
    },
    { label: "Type", key: "type" },
    { label: "Status", render: (row) => <StatusChip status={row.status} /> },
    {
      label: "Payment",
      render: (row) => <PaymentStatusChip status={row.paymentStatus ?? "pending"} />,
    },
    {
      label: "Scheduled",
      render: (row) =>
        row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—",
    },
    {
      label: "Price",
      render: (row) => `GH₵ ${row.priceQuote.toFixed(2)}`,
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
            Account Information
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
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <StatusChip status={user.status} />
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
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Metadata
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Customer ID</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {user.id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Role</Typography>
              <Chip label={user.role} size="small" variant="outlined" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Date Created</Typography>
              <Typography>{new Date(user.createdAt).toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Last Updated</Typography>
              <Typography>{new Date(user.updatedAt).toLocaleString()}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Booking History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recent bookings for this customer.
          </Typography>
          {bookingsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bookingsError}
            </Alert>
          )}
          <AdminTable
            columns={bookingColumns}
            rows={bookings}
            loading={bookingsLoading}
            emptyMessage="No bookings found for this customer."
            rowKey={(row) => row.id}
            onRowClick={(row) =>
              router.push(`/admin/dashboard/bookings/${row.id}`)
            }
          />
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", gap: 2 }}>
        {user.status === "active" ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => openConfirm("suspend")}
          >
            Suspend Customer
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="success"
            onClick={() => openConfirm("activate")}
          >
            Activate Customer
          </Button>
        )}
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingAction === "suspend" ? "Suspend Customer" : "Activate Customer"}
        description={
          pendingAction === "suspend"
            ? `Are you sure you want to suspend ${user.firstName} ${user.lastName}? This will restrict their access to the platform.`
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
