"use client";

import { useCallback, useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";

import { useFormik } from "formik";
import * as Yup from "yup";

import {
  createAddress,
  deleteAddress,
  getLocations,
  listAddresses,
  updateAddress,
} from "@/api/customer.api";
import type { CreateAddressInput } from "@/api/customer.api";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import CustomerDashboardShell from "@/components/customer/CustomerDashboardShell";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import type { LocationSelection } from "@/lib/location";
import type { Address, AddressType, GhanaRegion } from "@/types/customer";

const ADDRESS_TYPES: AddressType[] = ["home", "office", "other"];

const validationSchema = Yup.object({
  label: Yup.string().trim().min(1, "Required").required("Label is required"),
  addressType: Yup.string()
    .oneOf(ADDRESS_TYPES, "Invalid type")
    .required("Address type is required"),
  region: Yup.string().required("Region is required"),
  district: Yup.string().required("District is required"),
  town: Yup.string().trim().min(1, "Required").required("Town is required"),
  streetAndHouseNumber: Yup.string().optional(),
  landmark: Yup.string().optional(),
  digitalAddress: Yup.string().optional(),
  directions: Yup.string().optional(),
  contactName: Yup.string().trim().min(1, "Required").required("Contact name is required"),
  contactPhone: Yup.string().trim().min(1, "Required").required("Contact phone is required"),
});

interface FormValues {
  label: string;
  addressType: AddressType;
  region: string;
  district: string;
  town: string;
  streetAndHouseNumber: string;
  landmark: string;
  digitalAddress: string;
  directions: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
  lat: string;
  lng: string;
}

const emptyValues: FormValues = {
  label: "",
  addressType: "home",
  region: "",
  district: "",
  town: "",
  streetAndHouseNumber: "",
  landmark: "",
  digitalAddress: "",
  directions: "",
  contactName: "",
  contactPhone: "",
  isDefault: false,
  lat: "",
  lng: "",
};

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [regions, setRegions] = useState<GhanaRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationSelection | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAddresses();
    if (response?.status === 200 && response.data.data) {
      setAddresses(response.data.data);
    } else {
      setError(response?.data?.message || "Failed to load addresses.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      await fetchAddresses();
    }
    load();
  }, [fetchAddresses]);

  useEffect(() => {
    async function load() {
      const response = await getLocations();
      if (response?.status === 200 && response.data.data) {
        setRegions(response.data.data);
      }
    }
    load();
  }, []);

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      setSuccess(null);

      const payload: CreateAddressInput = {
        label: values.label.trim(),
        addressType: values.addressType,
        region: values.region,
        district: values.district,
        town: values.town.trim(),
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        isDefault: values.isDefault,
        country: "GH",
      };
      if (values.streetAndHouseNumber.trim()) payload.streetAndHouseNumber = values.streetAndHouseNumber.trim();
      if (values.landmark.trim()) payload.landmark = values.landmark.trim();
      if (values.digitalAddress.trim()) payload.digitalAddress = values.digitalAddress.trim();
      if (values.directions.trim()) payload.directions = values.directions.trim();
      if (values.lat !== "" && values.lng !== "") {
        payload.lat = Number(values.lat);
        payload.lng = Number(values.lng);
      }

      let response;
      if (editingAddress) {
        response = await updateAddress(editingAddress.id, payload);
      } else {
        response = await createAddress(payload);
      }

      if (response?.status === 200 || response?.status === 201) {
        setSuccess(editingAddress ? "Address updated." : "Address added.");
        setDialogOpen(false);
        setEditingAddress(null);
        formik.resetForm();
        fetchAddresses();
      } else {
        setSubmitError(response?.data?.message || "Failed to save address.");
      }
      setSubmitting(false);
    },
  });

  const selectedRegion = regions.find((r) => r.name === formik.values.region);

  const handleOpenCreate = () => {
    setEditingAddress(null);
    formik.resetForm();
    setLocation(null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddress(address);
    formik.setValues({
      label: address.label,
      addressType: address.addressType,
      region: address.region,
      district: address.district,
      town: address.town,
      streetAndHouseNumber: address.streetAndHouseNumber ?? "",
      landmark: address.landmark ?? "",
      digitalAddress: address.digitalAddress ?? "",
      directions: address.directions ?? "",
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      isDefault: address.isDefault,
      lat: typeof address.lat === "number" ? String(address.lat) : "",
      lng: typeof address.lng === "number" ? String(address.lng) : "",
    });
    setLocation(
      typeof address.lat === "number" && typeof address.lng === "number"
        ? {
            formattedAddress: `${address.streetAndHouseNumber || ""} ${address.town}, ${address.district}, ${address.region}`.trim(),
            streetAndHouseNumber: address.streetAndHouseNumber ?? undefined,
            town: address.town,
            district: address.district,
            region: address.region,
            lat: address.lat,
            lng: address.lng,
          }
        : null,
    );
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
    formik.resetForm();
    setLocation(null);
    setSubmitError(null);
  };

  /** Matches a Places/geolocation selection to the Ghana dropdown values. */
  const handleLocationChange = (value: LocationSelection | null) => {
    setLocation(value);
    if (!value) {
      formik.setFieldValue("lat", "", true);
      formik.setFieldValue("lng", "", true);
      return;
    }
    formik.setFieldValue("lat", String(value.lat), true);
    formik.setFieldValue("lng", String(value.lng), true);

    if (value.town) formik.setFieldValue("town", value.town, true);
    if (value.streetAndHouseNumber) {
      formik.setFieldValue("streetAndHouseNumber", value.streetAndHouseNumber, true);
    }
    if (value.region) {
      const match = regions.find(
        (r) =>
          r.name.toLowerCase() === value.region!.toLowerCase() ||
          value.region!.toLowerCase().includes(r.name.toLowerCase()) ||
          r.name.toLowerCase().includes(value.region!.toLowerCase().replace(/\s+region$/, "")),
      );
      const regionName = match?.name ?? value.region;
      formik.setFieldValue("region", regionName, true);
      if (match && value.district) {
        const distMatch = match.districts.find(
          (d) =>
            d.toLowerCase() === value.district!.toLowerCase() ||
            d.toLowerCase().includes(value.district!.toLowerCase()) ||
            value.district!.toLowerCase().includes(d.toLowerCase()),
        );
        if (distMatch) formik.setFieldValue("district", distMatch, true);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const response = await deleteAddress(deleteTarget.id);
    if (response?.status === 200) {
      setSuccess(`Address "${deleteTarget.label}" deleted.`);
      setDeleteTarget(null);
      fetchAddresses();
    } else {
      setDeleteError(response?.data?.message || "Failed to delete address.");
    }
    setDeleteLoading(false);
  };

  return (
    <CustomerDashboardShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Address Book
          </Typography>
          <Typography color="text.secondary">
            Manage your saved addresses for bookings.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Address
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : addresses.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary">
              No saved addresses yet. Add one to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {addresses.map((address) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={address.id}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {address.label}
                      </Typography>
                      {address.isDefault && (
                        <Chip
                          icon={<StarIcon />}
                          label="Default"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(address)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteTarget(address);
                            setDeleteError(null);
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Chip label={address.addressType} size="small" variant="outlined" sx={{ mb: 1 }} />

                  <Typography variant="body2" color="text.secondary">
                    {address.region}, {address.district}, {address.town}
                  </Typography>
                  {address.streetAndHouseNumber && (
                    <Typography variant="body2" color="text.secondary">
                      {address.streetAndHouseNumber}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {address.contactName} · {address.contactPhone}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddress ? "Edit Address" : "Add Address"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ pt: 1 }}>
            <LocationAutocomplete
              value={location}
              onChange={handleLocationChange}
              label="Find your location"
              hint="Searching your address auto-fills region, district, town and coordinates."
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  id="label"
                  name="label"
                  label="Label"
                  value={formik.values.label}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.label && Boolean(formik.errors.label)}
                  helperText={formik.touched.label && formik.errors.label}
                />
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth margin="dense" error={formik.touched.addressType && Boolean(formik.errors.addressType)}>
                  <InputLabel>Address Type</InputLabel>
                  <Select
                    id="addressType"
                    name="addressType"
                    label="Address Type"
                    value={formik.values.addressType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth margin="dense" error={formik.touched.region && Boolean(formik.errors.region)}>
                  <InputLabel>Region</InputLabel>
                  <Select
                    id="region"
                    name="region"
                    label="Region"
                    value={formik.values.region}
                    onChange={(e) => {
                      formik.handleChange(e);
                      formik.setFieldValue("district", "");
                    }}
                    onBlur={formik.handleBlur}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.name} value={region.name}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.region && formik.errors.region && (
                    <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                      {formik.errors.region}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth margin="dense" error={formik.touched.district && Boolean(formik.errors.district)}>
                  <InputLabel>District</InputLabel>
                  <Select
                    id="district"
                    name="district"
                    label="District"
                    value={formik.values.district}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={!selectedRegion}
                  >
                    {(selectedRegion?.districts ?? []).map((district) => (
                      <MenuItem key={district} value={district}>
                        {district}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.district && formik.errors.district && (
                    <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                      {formik.errors.district}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              margin="dense"
              id="town"
              name="town"
              label="Town"
              value={formik.values.town}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.town && Boolean(formik.errors.town)}
              helperText={formik.touched.town && formik.errors.town}
            />
            <TextField
              fullWidth
              margin="dense"
              id="streetAndHouseNumber"
              name="streetAndHouseNumber"
              label="Street / House Number (optional)"
              value={formik.values.streetAndHouseNumber}
              onChange={formik.handleChange}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  id="landmark"
                  name="landmark"
                  label="Landmark (optional)"
                  value={formik.values.landmark}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  id="digitalAddress"
                  name="digitalAddress"
                  label="Digital Address (optional)"
                  value={formik.values.digitalAddress}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              margin="dense"
              id="directions"
              name="directions"
              label="Directions (optional)"
              multiline
              rows={2}
              value={formik.values.directions}
              onChange={formik.handleChange}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  id="contactName"
                  name="contactName"
                  label="Contact Name"
                  value={formik.values.contactName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactName && Boolean(formik.errors.contactName)}
                  helperText={formik.touched.contactName && formik.errors.contactName}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  id="contactPhone"
                  name="contactPhone"
                  label="Contact Phone"
                  value={formik.values.contactPhone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                  helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  id="isDefault"
                  name="isDefault"
                  checked={formik.values.isDefault}
                  onChange={formik.handleChange}
                />
              }
              label="Set as default address"
              sx={{ mt: 1 }}
            />
          </Box>
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : editingAddress ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Address"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.label}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      >
        {deleteError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteError}
          </Alert>
        )}
      </ConfirmDialog>
    </CustomerDashboardShell>
  );
}
