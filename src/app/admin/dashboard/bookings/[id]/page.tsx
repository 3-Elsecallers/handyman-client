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

import {
  buildServiceNameMap,
  getAdminBooking,
  getBookingTimeline,
  resolveDispute,
} from "@/api/booking.api";
import { listAdminPayments, type Payment } from "@/api/payment.api";
import PaymentStatusChip from "@/components/admin/PaymentStatusChip";
import StatusChip from "@/components/admin/StatusChip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { Booking, BookingTimelineEntry } from "@/types/customer";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function timelineLabel(status: string) {
  const labels: Record<string, string> = {
    created: "Created",
    invited: "Invited",
    pending: "Pending",
    confirmed: "Confirmed",
    declined: "Declined",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
    resolved: "Resolved",
    started: "Started",
  };
  return labels[status] || status;
}

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<BookingTimelineEntry[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingResolve, setPendingResolve] = useState<"completed" | "cancelled" | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [bookingResponse, timelineResponse] = await Promise.all([
      getAdminBooking(id),
      getBookingTimeline(id),
    ]);
    if (bookingResponse?.status === 200 && bookingResponse.data.data) {
      setBooking(bookingResponse.data.data);
    } else {
      setError(bookingResponse?.data?.message || "Failed to load booking.");
    }
    if (timelineResponse?.status === 200 && timelineResponse.data.data) {
      setTimeline(timelineResponse.data.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() {
      const nameMap = await buildServiceNameMap();
      setServiceMap(nameMap);
    }
    load();
  }, []);

  useEffect(() => {
    async function load() { await fetchData(); }
    load();
  }, [fetchData]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    const response = await listAdminPayments({ bookingId: id, limit: 50 });
    if (response?.status === 200 && response.data.data) {
      setPayments(response.data.data.payments);
    } else {
      setPaymentsError(response?.data?.message || "Failed to load transaction history.");
    }
    setPaymentsLoading(false);
  }, [id]);

  useEffect(() => {
    async function load() { await fetchPayments(); }
    load();
  }, [fetchPayments]);

  const handleResolve = async () => {
    if (!pendingResolve) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = await resolveDispute(id, { resolveTo: pendingResolve });
    if (response?.status === 200) {
      setActionSuccess(`Dispute resolved as ${pendingResolve}.`);
      fetchData();
    } else {
      setActionError(response?.data?.message || "Failed to resolve dispute.");
    }
    setActionLoading(false);
    setPendingResolve(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !booking) {
    return <Alert severity="error">{error || "Booking not found."}</Alert>;
  }

  const serviceName = serviceMap[booking.serviceId] || booking.service?.name || booking.serviceId;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/dashboard/bookings")}
        sx={{ mb: 2 }}
      >
        Back to Bookings
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Booking Detail
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <StatusChip status={booking.status} />
        <PaymentStatusChip status={booking.paymentStatus ?? "pending"} />
        <Typography variant="body2" color="text.secondary">
          ID: <span style={{ fontFamily: "monospace" }}>{booking.id}</span>
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Booking Information
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Service</Typography>
              <Typography>{serviceName}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Type</Typography>
              <Typography>{booking.type}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Customer ID</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {booking.customerId}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Provider ID</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {booking.providerId || "—"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Scheduled</Typography>
              <Typography>
                {booking.scheduledAt ? (
                  <>
                    {new Date(booking.scheduledAt).toLocaleString()}
                    {booking.scheduledWindowEnd && (
                      <> — {new Date(booking.scheduledWindowEnd).toLocaleString()}</>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Reassignments</Typography>
              <Typography>{booking.reassignCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Promo Code</Typography>
              <Typography>{booking.promoCode?.code || "—"}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Created</Typography>
              <Typography>{formatDate(booking.createdAt)}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Price Breakdown
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Base Price</Typography>
              <Typography>GH₵ {booking.basePrice.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Complexity Multiplier</Typography>
              <Typography>{booking.complexityMultiplier.toFixed(2)}x</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Complexity Adjusted</Typography>
              <Typography>
                GH₵ {(booking.basePrice * booking.complexityMultiplier).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Travel Fee</Typography>
              <Typography>GH₵ {booking.travelFee.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Surge Amount</Typography>
              <Typography>GH₵ {booking.surgeAmount.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Promo Discount</Typography>
              <Typography>-GH₵ {booking.promoDiscount.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Final Price</Typography>
              <Typography sx={{ fontWeight: 700 }}>GH₵ {booking.priceQuote.toFixed(2)}</Typography>
            </Box>
          </Box>
          {booking.status === "cancelled" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Cancellation</Typography>
              <Typography>
                Cancelled on {formatDate(booking.cancelledAt)} by {booking.cancelledBy || "—"}
                {booking.cancellationReason ? ` — ${booking.cancellationReason}` : ""}
              </Typography>
              <Typography>
                Refund Amount: GH₵ {(booking.refundAmount ?? 0).toFixed(2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          {paymentsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentsError}
            </Alert>
          )}
          {paymentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : payments.length === 0 ? (
            <Typography color="text.secondary">No payments recorded for this booking.</Typography>
          ) : (
            payments.map((payment) => (
              <Box
                key={payment.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>
                    {payment.type === "tip" ? "Tip" : "Booking Payment"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <PaymentStatusChip status={payment.status} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(payment.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography>GH₵ {payment.amount.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Reference</Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {payment.paystackRef || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Platform Fee</Typography>
                    <Typography>GH₵ {payment.platformFee.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Provider Earning</Typography>
                    <Typography>GH₵ {payment.providerEarning.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tip</Typography>
                    <Typography>GH₵ {payment.tipAmount.toFixed(2)}</Typography>
                  </Box>
                  {payment.refundedAmount > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Refunded Total</Typography>
                      <Typography>GH₵ {payment.refundedAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                </Box>
                {payment.refunds && payment.refunds.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Refunds
                    </Typography>
                    {payment.refunds.map((refund) => (
                      <Box key={refund.id} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            GH₵ {refund.amount.toFixed(2)}
                          </Typography>
                          {refund.reason && (
                            <Typography variant="caption" color="text.secondary">
                              {refund.reason}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {refund.status} · {new Date(refund.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Location
          </Typography>
          <Typography>{booking.locationLine1}</Typography>
          {booking.locationLine2 && <Typography>{booking.locationLine2}</Typography>}
          <Typography>
            {booking.locationCity}, {booking.locationState} {booking.locationPostal}
          </Typography>
          {booking.locationLat != null && booking.locationLng != null && (
            <Typography variant="body2" color="text.secondary">
              ({booking.locationLat.toFixed(4)}, {booking.locationLng.toFixed(4)})
            </Typography>
          )}
        </CardContent>
      </Card>

      {booking.invites && booking.invites.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invites
            </Typography>
            {booking.invites.map((invite) => (
              <Box key={invite.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ fontFamily: "monospace" }}>{invite.providerId}</span>
                </Typography>
                <Chip label={invite.status} size="small" variant="outlined" />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Timeline
          </Typography>
          {timeline.length === 0 ? (
            <Typography color="text.secondary">No timeline entries.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {timeline.map((entry) => (
                <Box key={entry.id}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {timelineLabel(entry.status)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {entry.actorRole && (
                      <Typography variant="caption" color="text.secondary">
                        by {entry.actorRole}
                      </Typography>
                    )}
                    {entry.note && (
                      <Typography variant="body2" color="text.secondary">
                        {entry.note}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {booking.status === "disputed" && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resolve Dispute
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => setPendingResolve("completed")}
                disabled={actionLoading}
              >
                Mark Completed
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setPendingResolve("cancelled")}
                disabled={actionLoading}
              >
                Mark Cancelled
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={pendingResolve !== null}
        title="Resolve Dispute"
        description={
          pendingResolve === "completed"
            ? "Mark this booking as completed and resolve the dispute?"
            : "Mark this booking as cancelled and resolve the dispute?"
        }
        confirmLabel={pendingResolve === "completed" ? "Mark Completed" : "Mark Cancelled"}
        loading={actionLoading}
        onConfirm={handleResolve}
        onClose={() => setPendingResolve(null)}
      />
    </Box>
  );
}
