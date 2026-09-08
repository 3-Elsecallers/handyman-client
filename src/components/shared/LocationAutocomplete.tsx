"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import {
  getCurrentPosition,
  toLocationSelection,
  type LocationSelection,
} from "@/lib/location";
import { useGoogleMaps } from "@/lib/useGoogleMaps";

export interface LocationAutocompleteHandle {
  /** Clears the current selection and any errors. */
  clear: () => void;
}

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: LocationSelection | null;
  onChange: (value: LocationSelection | null) => void;
  error?: boolean;
  helperText?: string;
  /** A short note shown when the location is not yet captured. */
  hint?: string;
}

/**
 * A reusable address picker that:
 *  - uses Google Places Autocomplete when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
 *  - always offers a "Use my current location" (Geolocation API) button
 *  - falls back to a manual lat/lng entry when Places is unavailable
 * Emits a normalized LocationSelection via onChange.
 */
const LocationAutocomplete = forwardRef<
  LocationAutocompleteHandle,
  LocationAutocompleteProps
>(function LocationAutocomplete(
  {
    label = "Search for your address",
    placeholder = "Start typing your address…",
    value,
    onChange,
    error,
    helperText,
    hint,
  },
  ref,
) {
  const { supported, load } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState(value?.formattedAddress ?? "");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [manual, setManual] = useState({ lat: "", lng: "" });

  useImperativeHandle(ref, () => ({
    clear: () => {
      onChange(null);
      setQuery("");
      setManual({ lat: "", lng: "" });
      setGeoError(null);
      if (autocompleteRef.current) {
        autocompleteRef.current.set("place", undefined);
      }
    },
  }));

  // Keep the visible query in sync when the parent resets the value.
  useEffect(() => {
    if (value?.formattedAddress !== undefined) {
      setQuery(value.formattedAddress);
    }
  }, [value?.formattedAddress]);

  useEffect(() => {
    let cancelled = false;
    if (!supported || loadFailed) return;

    (async () => {
      try {
        await load();
        if (!cancelled) setLoaded(true);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, loadFailed, load]);

  const attachAutocomplete = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (!node || !supported || loadFailed || !autocompleteRef.current) {
        // Load happens asynchronously; (re)attempt on ready.
        if (node && supported && !loadFailed) {
          // handled by the effect below / re-render
        }
        return;
      }
    },
    [supported, loadFailed],
  );

  useEffect(() => {
    if (!supported || loadFailed || !loaded) return;
    const input = inputRef.current;
    if (!input || autocompleteRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    try {
      autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "GH" },
        fields: [
          "address_components",
          "geometry",
          "formatted_address",
        ],
        types: ["address"],
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete!.getPlace();
        const selection = toLocationSelection(place);
        setQuery(selection.formattedAddress);
        setManual({ lat: String(selection.lat), lng: String(selection.lng) });
        setGeoError(null);
        onChange(selection);
      });
    } catch {
      setLoadFailed(true);
    }
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
      autocompleteRef.current = null;
    };
  }, [supported, loadFailed, loaded, onChange]);

  const handleManualChange = useCallback(
    (field: "lat" | "lng") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...manual, [field]: e.target.value };
      setManual(next);
      const lat = Number(next.lat);
      const lng = Number(next.lng);
      setGeoError(null);
      if (
        next.lat !== "" &&
        next.lng !== "" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        onChange({
          formattedAddress: value?.formattedAddress ?? "Custom location",
          lat,
          lng,
          city: value?.city,
          district: value?.district,
          region: value?.region,
        });
      }
    },
    [manual, onChange, value],
  );

  const handleLocate = useCallback(async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const { lat, lng } = await getCurrentPosition();
      setManual({ lat: String(lat), lng: String(lng) });
      const selection: LocationSelection = {
        formattedAddress: `Current location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat,
        lng,
      };
      onChange(selection);
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "Unable to locate you");
    } finally {
      setLocating(false);
    }
  }, [onChange]);

  const showManual =
    (!supported || loadFailed) && !value;

  const resolvedHelperText =
    value?.formattedAddress &&
    value.formattedAddress !== "Custom location" &&
    value.formattedAddress.startsWith("Current location")
      ? (helperText ?? "Coordinates captured from your device.")
      : (helperText ?? (hint ? hint : undefined));

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        size="small"
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        inputRef={attachAutocomplete}
        error={error && !value}
        helperText={error && !value ? helperText : resolvedHelperText}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                {locating ? (
                  <CircularProgress size={18} />
                ) : (
                  <Button
                    size="small"
                    startIcon={<MyLocationIcon />}
                    onClick={handleLocate}
                    sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                  >
                    Current location
                  </Button>
                )}
              </InputAdornment>
            ),
          },
        }}
      />

      {!supported && (
        <Typography variant="caption" color="text.secondary">
          Address search is unavailable (no maps key configured) — use your
          current location or enter coordinates below.
        </Typography>
      )}

      {geoError && (
        <Typography variant="caption" color="error">
          {geoError}
        </Typography>
      )}

      {showManual && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            label="Latitude"
            value={manual.lat}
            onChange={handleManualChange("lat")}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
          />
          <TextField
            size="small"
            label="Longitude"
            value={manual.lng}
            onChange={handleManualChange("lng")}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
          />
        </Box>
      )}
    </Stack>
  );
});

export default LocationAutocomplete;
