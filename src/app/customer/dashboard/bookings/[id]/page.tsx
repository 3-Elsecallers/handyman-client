"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
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
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneIcon from "@mui/icons-material/Phone";

import {
  cancelBooking,
  getBooking,
  getBookingProvider,
  getBookingTimeline,
  reassignBooking,
  submitReview,
} from "@/api/customer.api";
import {
  addTip,
  getPaymentByBooking,
  initializePayment,
  verifyPayment,
  type Payment,
} from "@/api/payment.api";
import type { BookingProvider, BookingTimelineEntry } from "@/api/customer.api";
import StatusChip from "@/components/admin/StatusChip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import type { Booking } from "@/types/customer";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;

  // Paystack appends the transaction reference to the redirect_url on return.
  const returningFromPayment = Boolean(
    searchParams.get("reference") || searchParams.get("trxref"),
  );

  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<BookingTimelineEntry[]>([]);
  const [provider, setProvider] = useState<BookingProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignConfirmOpen, setReassignConfirmOpen] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const [tipLoading, setTipLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const bookingResponse = await getBooking(bookingId);
    if (bookingResponse?.status === 200 && bookingResponse.data.data) {
      const data = bookingResponse.data.data;
      setBooking(data);
      const [timelineResponse, providerResponse] = await Promise.all([
        getBookingTimeline(bookingId),
        data.providerId ? getBookingProvider(bookingId) : Promise.resolve(undefined),
      ]);
      if (timelineResponse?.status === 200 && timelineResponse.data.data) {
        setTimeline(timelineResponse.data.data);
      }
      if (providerResponse?.status === 200 && providerResponse.data.data) {
        setProvider(providerResponse.data.data);
      }
    } else {
      setError(bookingResponse?.data?.message || "Failed to load booking.");
    }
    setLoading(false);
  }, [bookingId]);

  const fetchPayment = useCallback(async () => {
    const response = await getPaymentByBooking(bookingId);
    if (
      response &&
      response.status === 200 &&
      response.data?.data
    ) {
      let p = response.data.data;
      // If the user just returned from the Paystack checkout, reconcile the
      // payment so the result reflects the charge even if the webhook hasn't
      // landed yet (local/dev testing, webhook delays, etc.).
      if (returningFromPayment && p.status === "pending") {
        const verifyResponse = await verifyPayment(p.id);
        if (
          verifyResponse &&
          verifyResponse.status === 200 &&
          verifyResponse.data?.data
        ) {
          p = verifyResponse.data.data;
        }
      }
      setPayment(p);
      if (p.status === "paid") {
        await fetchData();
      }
    } else {
      setPayment(null);
    }
  }, [bookingId, returningFromPayment, fetchData]);

  useEffect(() => {
    async function load() {
      await fetchData();
      await fetchPayment();
    }
    load();
  }, [fetchData, fetchPayment]);

  const handleCancel = async () => {
    setCancelLoading(true);
    setActionError(null);
    const response = await cancelBooking(bookingId, cancelReason || undefined);
    if (response?.status === 200) {
      setCancelOpen(false);
      setCancelReason("");
      await fetchData();
    } else {
      setActionError(response?.data?.message || "Failed to cancel booking.");
    }
    setCancelLoading(false);
  };

  const handleReassign = async () => {
    setReassignLoading(true);
    setActionError(null);
    const response = await reassignBooking(bookingId);
    if (response?.status === 200) {
      setReassignConfirmOpen(false);
      await fetchData();
    } else {
      setActionError(response?.data?.message || "Failed to request a new provider.");
    }
    setReassignLoading(false);
  };

  const handleReview = async () => {
    if (reviewRating < 1) return;
    setReviewLoading(true);
    setActionError(null);
    const response = await submitReview(bookingId, {
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
    if (response?.status === 200 || response?.status === 201) {
      setReviewOpen(false);
      setReviewRating(0);
      setReviewComment("");
      setReviewSuccess("Thanks! Your review has been submitted.");
    } else {
      setActionError(response?.data?.message || "Failed to submit review.");
    }
    setReviewLoading(false);
  };

  const handlePay = async () => {
    setPaymentLoading(true);
    setPayError(null);
    const response = await initializePayment(bookingId);
    if (
      response &&
      (response.status === 200 || response.status === 201) &&
      response.data?.data
    ) {
      const p = response.data.data;
      setPayment(p);
      if (p.authorizationUrl) {
        window.location.href = p.authorizationUrl;
      }
    } else {
      setPayError(response?.data?.message || "Failed to initialize payment.");
    }
    setPaymentLoading(false);
  };

  const handleVerify = async () => {
    if (!payment) return;
    setPaymentLoading(true);
    setPayError(null);
    const response = await verifyPayment(payment.id);
    if (response && response.status === 200 && response.data?.data) {
      setPayment(response.data.data);
      await fetchData();
    } else {
      setPayError(response?.data?.message || "Could not confirm payment.");
    }
    setPaymentLoading(false);
  };

  const handleTip = async () => {
    const amount = Number(tipAmount);
    if (!payment || !amount || amount <= 0) return;
    setTipLoading(true);
    setPayError(null);
    const response = await addTip(payment.id, amount);
    if (response && (response.status === 200 || response.status === 201) && response.data?.data) {
      setPayment(response.data.data);
      setTipAmount("");
    } else {
      setPayError(response?.data?.message || "Failed to add tip.");
    }
    setTipLoading(false);
  };

  const canCancel =
    booking &&
    (booking.status === "pending" || booking.status === "confirmed");

  const canReassign =
    booking &&
    booking.status === "confirmed" &&
    booking.reassignCount < 3;

  const canReview =
    booking && booking.status === "completed" && !reviewSuccess;

  const paymentStatus = payment?.status ?? booking?.paymentStatus ?? "pending";
  const paymentIsPaid = paymentStatus === "paid";
  const paymentIsRefunded = paymentStatus === "refunded";
  const isCash = booking?.paymentMethod === "cash";
  const canPay =
    booking?.status === "completed" &&
    !paymentIsPaid &&
    !paymentIsRefunded &&
    !isCash;
  const canTip =
    booking?.status === "completed" && payment && payment.status === "paid";

  if (loading) {
    return (
      <CustomerDashboardShell>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </CustomerDashboardShell>
    );
  }

  if (error && !booking) {
    return (
      <CustomerDashboardShell>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => router.push("/customer/dashboard/bookings")}
        >
          Back to Bookings
        </Button>
      </CustomerDashboardShell>
    );
  }

  if (!booking) {
    return (
      <CustomerDashboardShell>
        <Alert severity="warning">Booking not found.</Alert>
      </CustomerDashboardShell>
    );
  }

  return (
    <CustomerDashboardShell>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", mb: 2 }}
      >
        <IconButton onClick={() => router.push("/customer/dashboard/bookings")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Booking #{booking.id.slice(0, 8)}
        </Typography>
        <StatusChip status={booking.status} />
        <Chip label={booking.type} size="small" variant="outlined" />
        <Chip
          label={
            paymentIsRefunded
              ? "Refunded"
              : paymentIsPaid
                ? "Paid"
                : paymentStatus === "failed"
                  ? "Payment Failed"
                  : paymentStatus === "cash_outstanding"
                    ? "Cash Outstanding"
                    : paymentStatus === "cash_collected"
                      ? "Cash Collected"
                      : paymentStatus === "confirmed"
                        ? "Confirmed"
                        : "Payment Pending"
          }
          size="small"
          variant="outlined"
          color={
            paymentIsRefunded
              ? "default"
              : paymentIsPaid
                ? "success"
                : paymentStatus === "failed"
                  ? "error"
                  : paymentStatus === "cash_outstanding"
                    ? "warning"
                    : paymentStatus === "cash_collected" || paymentStatus === "confirmed"
                      ? "info"
                      : "warning"
          }
        />
      </Stack>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {reviewSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReviewSuccess(null)}>
          {reviewSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Price Breakdown
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Base price</Typography>
                <Typography variant="body2">₵{booking.basePrice.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">
                  Complexity multiplier (×{booking.complexityMultiplier})
                </Typography>
                <Typography variant="body2">₵{(booking.basePrice * booking.complexityMultiplier).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Travel fee</Typography>
                <Typography variant="body2">₵{booking.travelFee.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Surge</Typography>
                <Typography variant="body2">₵{booking.surgeAmount.toFixed(2)}</Typography>
              </Box>
              {booking.promoCode && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    Promo ({booking.promoCode.code})
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -₵{booking.promoDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ₵{booking.priceQuote.toFixed(2)}
                </Typography>
              </Box>
              {booking.status === "cancelled" && booking.refundAmount != null && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Refund: ₵{booking.refundAmount.toFixed(2)}
                  {booking.cancellationReason
                    ? ` · Reason: ${booking.cancellationReason}`
                    : ""}
                </Alert>
              )}
              {booking.status === "cancelled" && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Cancelled at {booking.cancelledAt
                    ? new Date(booking.cancelledAt).toLocaleString()
                    : "—"}
                  {booking.cancelledBy ? ` by ${booking.cancelledBy}` : ""}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Payment
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Status</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: paymentIsRefunded
                      ? "text.secondary"
                      : paymentIsPaid
                        ? "success.main"
                        : paymentStatus === "failed"
                          ? "error.main"
                          : "warning.main",
                  }}
                >
                  {paymentIsRefunded
                    ? "Refunded"
                    : paymentIsPaid
                      ? "Paid"
                      : paymentStatus === "failed"
                        ? "Failed"
                        : "Pending"}
                </Typography>
              </Box>
              {payment?.paystackRef && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Reference</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {payment.paystackRef}
                  </Typography>
                </Box>
              )}
              {payment?.amount != null && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Amount</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₵{payment.amount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {paymentIsPaid && payment?.tipAmount != null && payment.tipAmount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Tip</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₵{payment.tipAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {canPay && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handlePay}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : "Pay Now"}
                  </Button>
                </Box>
              )}
              {paymentIsPaid && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={handleVerify}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : "Verify Payment"}
                </Button>
              )}
              {isCash && booking.status === "completed" && !paymentIsPaid && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please pay the provider in cash after the service.{" "}
                  {provider ? `${provider.name ?? "The provider"} will confirm` : "They will confirm"}{" "}
                  receipt to complete the payment.
                </Alert>
              )}
              {payError && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setPayError(null)}>
                  {payError}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Service
              </Typography>
              <Typography variant="subtitle1">
                {booking.service?.name ?? booking.serviceId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complexity: {booking.complexity} · Duration: {booking.durationMins} min · Reassignments: {booking.reassignCount}
              </Typography>
              {booking.type === "request" && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Requested window: {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : "—"}
                  {" – "}
                  {booking.scheduledWindowEnd ? new Date(booking.scheduledWindowEnd).toLocaleString() : "—"}
                </Typography>
              )}
              {booking.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Description: {booking.description}
                </Typography>
              )}
              {booking.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Notes: {booking.notes}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Location
              </Typography>
              <Typography variant="body2">
                {booking.locationLine1}
                {booking.locationLine2 ? `, ${booking.locationLine2}` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {booking.locationCity}, {booking.locationState}, {booking.locationPostal}
              </Typography>
              {booking.locationLat != null && (
                <Typography variant="caption" color="text.secondary">
                  ({booking.locationLat}, {booking.locationLng})
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Status Timeline
              </Typography>
              {timeline.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No timeline events yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {timeline.map((entry, index) => (
                    <Box key={entry.id} sx={{ display: "flex", gap: 2 }}>
                      <Stack
                        direction="column"
                        sx={{ alignItems: "center" }}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: index === 0 ? "primary.main" : "grey.400",
                            fontSize: 12,
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        {index < timeline.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              flexGrow: 1,
                              bgcolor: "grey.300",
                              minHeight: 24,
                            }}
                          />
                        )}
                      </Stack>
                      <Box sx={{ pb: entry.note ? 1 : 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {entry.status.replace(/_/g, " ")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.createdAt).toLocaleString()}
                          {entry.actorRole ? ` · by ${entry.actorRole}` : ""}
                        </Typography>
                        {entry.note && (
                          <Typography variant="body2" color="text.secondary">
                            {entry.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Provider
              </Typography>
              {provider ? (
                <Box>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", mb: 2 }}
                  >
                    <Avatar
                      src={provider.avatarUrl ?? undefined}
                      sx={{ width: 56, height: 56 }}
                    >
                      {(provider.name ?? "P").charAt(0)}
                    </Avatar>
                    <Box>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center" }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {provider.name ?? "Provider"}
                        </Typography>
                        {provider.verified && (
                          <VerifiedIcon color="primary" fontSize="small" />
                        )}
                      </Stack>
                      {provider.avgRating != null && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: "center" }}
                        >
                          <StarIcon fontSize="small" color="warning" />
                          <Typography variant="body2">
                            {provider.avgRating.toFixed(1)} ({provider.totalJobs ?? 0} jobs)
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                  {provider.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {provider.bio}
                    </Typography>
                  )}
                  {provider.avgResponseTimeMins != null && (
                    <Typography variant="caption" color="text.secondary">
                      Avg response time: {provider.avgResponseTimeMins} min
                    </Typography>
                  )}
                  {provider.phone && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center" }}
                    >
                      <PhoneIcon color="primary" fontSize="small" />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {provider.phone}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {booking.providerId
                      ? "Provider details unavailable."
                      : booking.status === "pending"
                        ? "Awaiting provider assignment. We'll match a provider to your request."
                        : "No provider assigned yet."}
                  </Typography>
                  {booking.invites && booking.invites.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {booking.invites.length} provider invite(s)
                      </Typography>
                      {booking.invites.map((invite) => (
                        <Chip
                          key={invite.id}
                          size="small"
                          label={`Invite ${invite.status} (${new Date(invite.expiresAt).toLocaleDateString()})`}
                          variant="outlined"
                          sx={{ mt: 0.5, display: "flex" }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Actions
              </Typography>
              <Stack spacing={1}>
                {canCancel && (
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Booking
                  </Button>
                )}
                {canReassign && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setReassignConfirmOpen(true)}
                  >
                    Request New Provider ({3 - booking.reassignCount} left)
                  </Button>
                )}
                {canReview && !reviewOpen && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => {
                      setReviewRating(0);
                      setReviewComment("");
                      setReviewOpen(true);
                    }}
                  >
                    Leave a Review
                  </Button>
                )}
                {canTip && (
                  <Box>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Tip (₵)"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        disabled={tipLoading}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleTip}
                        disabled={tipLoading || !Number(tipAmount) || Number(tipAmount) <= 0}
                      >
                        {tipLoading ? <CircularProgress size={20} color="inherit" /> : "Send Tip"}
                      </Button>
                    </Stack>
                  </Box>
                )}
                <Button variant="outlined" fullWidth onClick={() => router.push("/customer/dashboard/bookings")}>
                  Back to Bookings
                </Button>
              </Stack>
              {booking.reassignCount >= 3 && booking.status === "confirmed" && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Maximum reassignments reached (3).
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel Booking"
        loading={cancelLoading}
        onConfirm={handleCancel}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason("");
        }}
      >
        <TextField
          fullWidth
          margin="dense"
          label="Reason (optional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={reassignConfirmOpen}
        title="Request New Provider"
        description="Are you sure you want to request a new provider for this booking?"
        confirmLabel="Request New Provider"
        loading={reassignLoading}
        onConfirm={handleReassign}
        onClose={() => setReassignConfirmOpen(false)}
      />

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <IconButton
                key={value}
                onClick={() => setReviewRating(value)}
                onMouseEnter={() => setReviewHover(value)}
                onMouseLeave={() => setReviewHover(0)}
              >
                {value <= (reviewHover || reviewRating) ? (
                  <StarIcon color="warning" />
                ) : (
                  <StarBorderIcon />
                )}
              </IconButton>
            ))}
          </Stack>
          {reviewRating === 0 && (
            <Typography variant="caption" color="error">
              Please select a rating from 1 to 5.
            </Typography>
          )}
          <TextField
            fullWidth
            margin="dense"
            label="Comment (optional)"
            multiline
            rows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)} disabled={reviewLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleReview}
            variant="contained"
            disabled={reviewLoading || reviewRating === 0}
          >
            {reviewLoading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </CustomerDashboardShell>
  );
}
