"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import { useFormik } from "formik";
import * as Yup from "yup";

import {
  createInstantBooking,
  createRequestBooking,
  getBookingEstimate,
  getLocations,
  listAddresses,
  listCategories,
  listServices,
} from "@/api/customer.api";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import type { Address, Complexity, CustomerServiceCategory, GhanaRegion, PriceBreakdown, Service } from "@/types/customer";

const COMPLEXITIES: { value: Complexity; label: string; multiplier: string }[] = [
  { value: "standard", label: "Standard", multiplier: "1.0x" },
  { value: "moderate", label: "Moderate", multiplier: "1.25x" },
  { value: "complex", label: "Complex", multiplier: "1.5x" },
];

interface QuickAddressForm {
  label: string;
  region: string;
  district: string;
  town: string;
  streetAndHouseNumber: string;
  contactName: string;
  contactPhone: string;
  lat: string;
  lng: string;
}

const quickAddressSchema = Yup.object({
  label: Yup.string().trim().min(1, "Required").required("Label is required"),
  region: Yup.string().required("Region is required"),
  district: Yup.string().required("District is required"),
  town: Yup.string().trim().min(1, "Required").required("Town is required"),
  streetAndHouseNumber: Yup.string().optional(),
  contactName: Yup.string().trim().min(1, "Required").required("Contact name is required"),
  contactPhone: Yup.string().trim().min(1, "Required").required("Contact phone is required"),
  lat: Yup.string().optional(),
  lng: Yup.string().optional(),
});

function NewBookingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const serviceIdParam = params.get("serviceId");

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CustomerServiceCategory[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [pickError, setPickError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [regions, setRegions] = useState<GhanaRegion[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [quickAddressMode, setQuickAddressMode] = useState(false);

  const [bookingType, setBookingType] = useState<"instant" | "request">("request");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [scheduledAt, setScheduledAt] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [providerId, setProviderId] = useState("");
  const [description, setDescription] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const [estimate, setEstimate] = useState<PriceBreakdown | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const quickAddressFormik = useFormik({
    initialValues: {
      label: "",
      region: "",
      district: "",
      town: "",
      streetAndHouseNumber: "",
      contactName: "",
      contactPhone: "",
      lat: "",
      lng: "",
    },
    validationSchema: quickAddressSchema,
    onSubmit: async (values) => {
      setQuickAddressMode(false);
      setSelectedAddressId("quick");
    },
  });

  const selectedRegion = regions.find((r) => r.name === quickAddressFormik.values.region);

  const selectedAddress = useMemo(() => {
    if (selectedAddressId === "") return null;
    if (selectedAddressId === "quick") return null;
    return addresses.find((a) => a.id === selectedAddressId) ?? null;
  }, [selectedAddressId, addresses]);

  const locationFields = useMemo(() => {
    if (selectedAddressId === "quick") {
      return {
        locationLine1: quickAddressFormik.values.streetAndHouseNumber || quickAddressFormik.values.town,
        locationLine2: undefined,
        locationCity: quickAddressFormik.values.town,
        locationState: quickAddressFormik.values.district,
        locationPostal: quickAddressFormik.values.region,
        locationLat: quickAddressFormik.values.lat ? Number(quickAddressFormik.values.lat) : null,
        locationLng: quickAddressFormik.values.lng ? Number(quickAddressFormik.values.lng) : null,
      };
    }
    const addr = selectedAddress;
    if (!addr) {
      return {
        locationLine1: "",
        locationLine2: undefined,
        locationCity: "",
        locationState: "",
        locationPostal: "",
        locationLat: null,
        locationLng: null,
      };
    }
    return {
      locationLine1: addr.streetAndHouseNumber || addr.town,
      locationLine2: addr.landmark ?? undefined,
      locationCity: addr.town,
      locationState: addr.district,
      locationPostal: addr.region,
      locationLat: addr.lat ?? null,
      locationLng: addr.lng ?? null,
    };
  }, [selectedAddressId, selectedAddress, quickAddressFormik.values]);

  useEffect(() => {
    async function load() {
      const response = await listAddresses();
      if (response?.status === 200 && response.data.data) {
        const items: Address[] = response.data.data;
        setAddresses(items);
        const def = items.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function load() {
      const response = await getLocations();
      if (response?.status === 200 && response.data.data) {
        setRegions(response.data.data);
      }
    }
    load();
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    setPickError(null);
    const response = await listServices({
      categoryId: categoryFilter || undefined,
      search: serviceSearch || undefined,
    });
    if (response?.status === 200 && response.data.data) {
      const items: Service[] = response.data.data;
      setServices(items);
      if (!selectedService && serviceIdParam) {
        const found = items.find((s) => s.id === serviceIdParam);
        if (found) {
          setSelectedService(found);
          setStep(1);
        }
      }
    } else {
      setPickError(response?.data?.message || "Failed to load services.");
    }
    setLoadingServices(false);
  }, [categoryFilter, serviceSearch, selectedService, serviceIdParam]);

  useEffect(() => {
    async function load() {
      await fetchServices();
    }
    load();
  }, [fetchServices]);

  useEffect(() => {
    async function load() {
      const response = await listCategories();
      if (response?.status === 200 && response.data.data) {
        setCategories(response.data.data);
      }
    }
    load();
  }, []);

  const estimateInputValid = useMemo(() => {
    if (!selectedService) return false;
    return locationFields.locationLat != null && locationFields.locationLng != null;
  }, [selectedService, locationFields]);

  useEffect(() => {
    if (!estimateInputValid) return;
    setEstimateLoading(true);
    setEstimateError(null);
    const timer = setTimeout(async () => {
      const response = await getBookingEstimate({
        type: bookingType,
        serviceId: selectedService!.id,
        providerId: bookingType === "instant" ? providerId || undefined : undefined,
        scheduledAt: bookingType === "instant" ? scheduledAt || undefined : undefined,
        complexity,
        promoCode: promoCode || undefined,
        locationLat: locationFields.locationLat,
        locationLng: locationFields.locationLng,
      });
      if (response?.status === 200 && response.data.data) {
        setEstimate(response.data.data);
      } else {
        setEstimate(null);
        setEstimateError(response?.data?.message || "Failed to get estimate.");
      }
      setEstimateLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    estimateInputValid,
    bookingType,
    selectedService,
    providerId,
    scheduledAt,
    complexity,
    promoCode,
    locationFields.locationLat,
    locationFields.locationLng,
  ]);

  const steps = ["Service", "Address", "Schedule", "Confirm"];

  const handlePickService = (service: Service) => {
    setSelectedService(service);
    setStep(1);
  };

  const handleConfirm = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    setSubmitError(null);
    const loc = locationFields;

    let response;
    if (bookingType === "instant") {
      if (!providerId.trim()) {
        setSubmitError("Provider ID is required for instant bookings.");
        setSubmitting(false);
        return;
      }
      response = await createInstantBooking({
        type: "instant",
        serviceId: selectedService.id,
        providerId: providerId.trim(),
        scheduledAt: scheduledAt,
        complexity,
        promoCode: promoCode || undefined,
        locationLine1: loc.locationLine1,
        locationLine2: loc.locationLine2,
        locationCity: loc.locationCity,
        locationState: loc.locationState,
        locationPostal: loc.locationPostal,
        locationLat: loc.locationLat,
        locationLng: loc.locationLng,
      });
    } else {
      response = await createRequestBooking({
        type: "request",
        serviceId: selectedService.id,
        scheduledWindowStart: windowStart,
        scheduledWindowEnd: windowEnd,
        complexity,
        description: description || undefined,
        locationLine1: loc.locationLine1,
        locationLine2: loc.locationLine2,
        locationCity: loc.locationCity,
        locationState: loc.locationState,
        locationPostal: loc.locationPostal,
        locationLat: loc.locationLat,
        locationLng: loc.locationLng,
      });
    }

    if (response?.status === 200 || response?.status === 201) {
      const booking = response.data.data;
      if (booking.id) {
        setCreatedBookingId(booking.id);
      } else {
        router.push("/customer/dashboard/bookings");
      }
    } else {
      setSubmitError(response?.data?.message || "Failed to create booking.");
    }
    setSubmitting(false);
  };

  if (createdBookingId) {
    return (
      <CustomerDashboardShell>
        <Paper variant="outlined" sx={{ p: 4, maxWidth: 520, mx: "auto", textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Booking Created!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Your booking #{createdBookingId.slice(0, 8)} has been placed. Track its status from the booking detail page.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "center" }}
          >
            <Button
              component={Link}
              href={`/customer/dashboard/bookings/${createdBookingId}`}
              variant="contained"
            >
              View Booking
            </Button>
            <Button
              component={Link}
              href="/customer/dashboard"
              variant="outlined"
            >
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </CustomerDashboardShell>
    );
  }

  return (
    <CustomerDashboardShell>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          New Booking
        </Typography>
        <Typography color="text.secondary">
          Book a service for your home or office.
        </Typography>
      </Box>

      {selectedService && (
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {step === 0 && (
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search services..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              sx={{ minWidth: 260 }}
            />
          </Stack>

          {pickError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pickError}
            </Alert>
          )}

          {loadingServices ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : services.length === 0 ? (
            <Alert severity="info">No services found.</Alert>
          ) : (
            <Grid container spacing={2}>
              {services.map((service) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
                  <Card variant="outlined">
                    <CardActionArea onClick={() => handlePickService(service)}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {service.name}
                        </Typography>
                        <Chip
                          label={service.category?.name ?? "Uncategorized"}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            ₵{service.basePrice.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {service.durationMins} min
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {step === 1 && selectedService && (
        <Box>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">{selectedService.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Base price ₵{selectedService.basePrice.toFixed(2)} · {selectedService.durationMins} min
              </Typography>
              <FormControl fullWidth margin="dense" sx={{ maxWidth: 320, mt: 2 }}>
                <InputLabel>Complexity</InputLabel>
                <Select
                  value={complexity}
                  label="Complexity"
                  onChange={(e) => setComplexity(e.target.value as Complexity)}
                >
                  {COMPLEXITIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label} ({c.multiplier})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={1}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" onClick={() => setStep(2)}>
              Next
            </Button>
          </Stack>
        </Box>
      )}

      {step === 2 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Delivery Address
          </Typography>

          {!quickAddressMode && addresses.length > 0 && (
            <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
              <Grid container spacing={1}>
                {addresses.map((address) => (
                  <Grid size={12} key={address.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderColor: selectedAddressId === address.id ? "primary.main" : undefined,
                        bgcolor: selectedAddressId === address.id ? "action.selected" : undefined,
                      }}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <FormControlLabel
                        value={address.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {address.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {address.region}, {address.district}, {address.town}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          )}

          {!quickAddressMode && addresses.length > 0 && (
            <Button sx={{ mt: 2 }} onClick={() => setQuickAddressMode(true)}>
              + Use a different address
            </Button>
          )}

          {(quickAddressMode || addresses.length === 0) && (
            <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Quick Address
              </Typography>
              <Box component="form" onSubmit={quickAddressFormik.handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="label"
                      name="label"
                      label="Label"
                      value={quickAddressFormik.values.label}
                      onChange={quickAddressFormik.handleChange}
                      error={quickAddressFormik.touched.label && Boolean(quickAddressFormik.errors.label)}
                      helperText={quickAddressFormik.touched.label && quickAddressFormik.errors.label}
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth margin="dense" error={quickAddressFormik.touched.region && Boolean(quickAddressFormik.errors.region)}>
                      <InputLabel>Region</InputLabel>
                      <Select
                        id="region"
                        name="region"
                        label="Region"
                        value={quickAddressFormik.values.region}
                        onChange={(e) => {
                          quickAddressFormik.handleChange(e);
                          quickAddressFormik.setFieldValue("district", "");
                        }}
                      >
                        {regions.map((region) => (
                          <MenuItem key={region.name} value={region.name}>
                            {region.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth margin="dense" error={quickAddressFormik.touched.district && Boolean(quickAddressFormik.errors.district)}>
                      <InputLabel>District</InputLabel>
                      <Select
                        id="district"
                        name="district"
                        label="District"
                        value={quickAddressFormik.values.district}
                        onChange={quickAddressFormik.handleChange}
                        disabled={!selectedRegion}
                      >
                        {(selectedRegion?.districts ?? []).map((district) => (
                          <MenuItem key={district} value={district}>
                            {district}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="town"
                      name="town"
                      label="Town"
                      value={quickAddressFormik.values.town}
                      onChange={quickAddressFormik.handleChange}
                      error={quickAddressFormik.touched.town && Boolean(quickAddressFormik.errors.town)}
                      helperText={quickAddressFormik.touched.town && quickAddressFormik.errors.town}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="streetAndHouseNumber"
                      name="streetAndHouseNumber"
                      label="Street / House Number (optional)"
                      value={quickAddressFormik.values.streetAndHouseNumber}
                      onChange={quickAddressFormik.handleChange}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="contactName"
                      name="contactName"
                      label="Contact Name"
                      value={quickAddressFormik.values.contactName}
                      onChange={quickAddressFormik.handleChange}
                      error={quickAddressFormik.touched.contactName && Boolean(quickAddressFormik.errors.contactName)}
                      helperText={quickAddressFormik.touched.contactName && quickAddressFormik.errors.contactName}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="contactPhone"
                      name="contactPhone"
                      label="Contact Phone"
                      value={quickAddressFormik.values.contactPhone}
                      onChange={quickAddressFormik.handleChange}
                      error={quickAddressFormik.touched.contactPhone && Boolean(quickAddressFormik.errors.contactPhone)}
                      helperText={quickAddressFormik.touched.contactPhone && quickAddressFormik.errors.contactPhone}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="lat"
                      name="lat"
                      label="Latitude (optional)"
                      value={quickAddressFormik.values.lat}
                      onChange={quickAddressFormik.handleChange}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      margin="dense"
                      id="lng"
                      name="lng"
                      label="Longitude (optional)"
                      value={quickAddressFormik.values.lng}
                      onChange={quickAddressFormik.handleChange}
                    />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Use This Address
                </Button>
              </Box>
            </Card>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button
              variant="contained"
              onClick={() => setStep(3)}
              disabled={selectedAddressId === ""}
            >
              Next
            </Button>
          </Stack>
        </Box>
      )}

      {step === 3 && selectedService && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Schedule & Confirm
          </Typography>

          <FormControl fullWidth sx={{ mb: 2, maxWidth: 320 }}>
            <InputLabel>Booking Type</InputLabel>
            <Select
              value={bookingType}
              label="Booking Type"
              onChange={(e) => setBookingType(e.target.value as "instant" | "request")}
            >
              <MenuItem value="request">
                Request (auto-match a provider to your schedule)
              </MenuItem>
              <MenuItem value="instant">Instant (book a specific provider)</MenuItem>
            </Select>
          </FormControl>

          {bookingType === "request" ? (
            <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Preferred Start"
                    type="datetime-local"
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Preferred End"
                    type="datetime-local"
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Description (optional)"
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Card>
          ) : (
            <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Scheduled Time"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Provider ID"
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    helperText="Enter the provider ID for the specific provider."
                  />
                </Grid>
              </Grid>
            </Card>
          )}

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Price Breakdown
              </Typography>
              <TextField
                fullWidth
                margin="dense"
                label="Promo Code (optional)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                sx={{ maxWidth: 280, mb: 1 }}
              />
              {estimateError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {estimateError}
                </Alert>
              )}
              {estimateLoading && !estimate ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : estimate ? (
                <Box>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Base price</Typography>
                    <Typography variant="body2">₵{estimate.basePrice.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">
                      Complexity multiplier (×{estimate.complexityMultiplier})
                    </Typography>
                    <Typography variant="body2">₵{estimate.complexityAdjusted.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Travel fee</Typography>
                    <Typography variant="body2">₵{estimate.travelFee.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Surge</Typography>
                    <Typography variant="body2">₵{estimate.surgeAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Promo discount</Typography>
                    <Typography variant="body2" color="success.main">
                      -₵{estimate.promoDiscount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      ₵{estimate.finalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Provide a location with coordinates to see an estimate.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Stack direction="row" spacing={1}>
            <Button onClick={() => setStep(2)} disabled={submitting}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Booking"}
            </Button>
          </Stack>
        </Box>
      )}
    </CustomerDashboardShell>
  );
}

export default function NewBookingPage() {
  return (
    <NewBookingWizard />
  );
}
