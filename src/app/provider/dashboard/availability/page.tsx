'use client';

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import DeleteIcon from "@mui/icons-material/Delete";

import { getAvailability, updateAvailability } from "@/api/provider.api";
import type { AvailabilitySlot } from "@/types/provider";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newDay, setNewDay] = useState<number>(0);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const response = await getAvailability();
      if (response?.status === 200 && response.data.data) {
        setSlots(response.data.data);
      } else {
        setError(response?.data?.message || "Failed to load availability.");
      }
      setLoading(false);
    })();
  }, []);

  const handleDelete = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAdd = () => {
    if (!newStart || !newEnd) return;
    setSlots((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        providerId: "",
        dayOfWeek: newDay,
        startTime: newStart,
        endTime: newEnd,
        isRecurring: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const response = await updateAvailability({
      slots: slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
    if (response?.status === 200 && response.data.data) {
      setSlots(response.data.data);
      setSuccess("Availability updated successfully.");
    } else {
      setError(response?.data?.message || "Failed to save availability.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const grouped = DAY_NAMES.map((name, index) => ({
    name,
    slots: slots.filter((s) => s.dayOfWeek === index),
  }));

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Availability Schedule
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your weekly availability for customer bookings.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {grouped.map((group) => (
        <Box key={group.name} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {group.name}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {group.slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No slots
            </Typography>
          ) : (
            group.slots.map((slot) => (
              <Card key={slot.id} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "12px !important" }}>
                  <Typography variant="body1">
                    {slot.startTime} – {slot.endTime}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => handleDelete(slot.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Add Slot
      </Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 4 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Day of Week</InputLabel>
          <Select
            value={newDay}
            label="Day of Week"
            onChange={(e) => setNewDay(Number(e.target.value))}
          >
            {DAY_NAMES.map((name, index) => (
              <MenuItem key={name} value={index}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start Time"
          type="time"
          size="small"
          value={newStart}
          onChange={(e) => setNewStart(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="End Time"
          type="time"
          size="small"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="outlined" onClick={handleAdd}>
          Add
        </Button>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={saving}
        onClick={handleSave}
        startIcon={saving ? <CircularProgress size={20} /> : undefined}
      >
        Save Schedule
      </Button>
    </Box>
  );
}
