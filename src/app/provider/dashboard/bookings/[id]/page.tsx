'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import {
  buildServiceNameMap,
  completeBooking,
  confirmBooking,
  confirmCash,
  declineBooking,
  getBooking,
  getBookingTimeline,
  startBooking,
} from "@/api/booking.api";
import StatusChip from "@/components/admin/StatusChip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type {
  Booking,
  BookingTimelineEntry,
} from "@/types/customer";

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

export default function ProviderBookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<BookingTimelineEntry[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [bookingResponse, timelineResponse] = await Promise.all([
      getBooking(id),
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

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const response = (await action()) as
      | { status?: number; data?: { message?: string } }
      | undefined;
    if (response?.status === 200) {
      setActionSuccess(successMessage);
      fetchData();
    } else {
      setActionError(response?.data?.message || "Action failed. Please try again.");
    }
    setActionLoading(false);
    setDeclineOpen(false);
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
        <Typography variant="body2" color="text.secondary">
          ID: <span style={{ fontFamily: "monospace" }}>{booking.id}</span>
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Service & Schedule
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
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography>{booking.durationMins} mins</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Complexity</Typography>
              <Typography>{booking.complexity}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Customer ID</Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {booking.customerId}
              </Typography>
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
              <Divider sx={{ mb: 2 }} />
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
            Location
          </Typography>
          <Typography>{booking.locationLine1}</Typography>
          {booking.locationLine2 && <Typography>{booking.locationLine2}</Typography>}
          <Typography>
            {booking.locationCity}, {booking.locationState} {booking.locationPostal}
          </Typography>
        </CardContent>
      </Card>

      {(booking.description || booking.notes) && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Description & Notes
            </Typography>
            <Typography color="text.secondary">{booking.description || "—"}</Typography>
            {booking.notes && (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {booking.notes}
              </Typography>
            )}
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

      {booking.status === "pending" && (
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => runAction(() => confirmBooking(booking.id), "Booking confirmed.")}
            disabled={actionLoading}
          >
            Confirm
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeclineOpen(true)}
            disabled={actionLoading}
          >
            Decline
          </Button>
        </Box>
      )}

      {booking.status === "confirmed" && (
        <Button
          variant="contained"
          onClick={() => runAction(() => startBooking(booking.id), "Job started.")}
          disabled={actionLoading}
        >
          Start Job
        </Button>
      )}

      {booking.status === "in_progress" && (
        <Button
          variant="contained"
          color="success"
          onClick={() => runAction(() => completeBooking(booking.id), "Job marked as complete.")}
          disabled={actionLoading}
        >
          Mark Complete
        </Button>
      )}

      {booking.status === "completed" && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Method</Typography>
                <Typography>{booking.paymentMethod === "cash" ? "Cash" : "Online"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Typography sx={{ textTransform: "capitalize" }}>
                  {(booking.paymentStatus ?? "pending").replace(/_/g, " ")}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Expected</Typography>
                <Typography>GH₵ {(booking.paymentAmountExpected ?? 0).toFixed(2)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Due</Typography>
                <Typography>{formatDate(booking.paymentDueAt ?? null)}</Typography>
              </Box>
            </Box>
            {booking.paymentOverdue && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This payment is overdue.
              </Alert>
            )}
            {booking.paymentMethod === "cash" &&
              booking.paymentStatus === "cash_outstanding" && (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ mt: 2 }}
                  onClick={() => runAction(() => confirmCash(booking.id), "Cash confirmed as received.")}
                  disabled={actionLoading}
                >
                  Confirm Cash Received
                </Button>
              )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={declineOpen}
        title="Decline Booking"
        description="Are you sure you want to decline this booking?"
        confirmLabel="Decline"
        loading={actionLoading}
        onConfirm={() => runAction(() => declineBooking(booking.id), "Booking declined.")}
        onClose={() => setDeclineOpen(false)}
      />
    </Box>
  );
}
