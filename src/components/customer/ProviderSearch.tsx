"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  searchProviders,
  type ProviderSearchResult,
} from "@/api/customer.api";

interface ProviderSearchProps {
  serviceId?: string;
  value: ProviderSearchResult | null;
  onChange: (provider: ProviderSearchResult | null) => void;
  disabled?: boolean;
}

function displayName(p: ProviderSearchResult): string {
  const u = p.user;
  return u
    ? `${u.firstName} ${u.lastName}`.trim()
    : `Provider ${p.id.slice(0, 8)}`;
}

/**
 * Debounced provider search for instant bookings. Shows matching providers in
 * a dropdown (name, avatar, ID) and lets the customer pick one.
 */
export default function ProviderSearch({
  serviceId,
  value,
  onChange,
  disabled,
}: ProviderSearchProps) {
  const [options, setOptions] = useState<ProviderSearchResult[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (q.length < 2) {
        setOptions([]);
        return;
      }
      setLoading(true);
      const response = await searchProviders({
        q,
        ...(serviceId ? { serviceId } : {}),
        limit: 10,
      });
      setLoading(false);
      const list = response?.data?.data?.providers;
      setOptions(Array.isArray(list) ? list : []);
    },
    [serviceId],
  );

  useEffect(() => {
    if (disabled || !open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(input);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, open, disabled, runSearch]);

  // Keep the currently-selected provider present in the dropdown options.
  const merged = useMemo(() => {
    if (!value) return options;
    if (options.some((o) => o.id === value.id)) return options;
    return [value, ...options];
  }, [options, value]);

  return (
    <Autocomplete
      fullWidth
      freeSolo={false}
      autoHighlight
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disabled={disabled}
      options={merged}
      value={value}
      loading={loading}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => displayName(option)}
      noOptionsText="No matching providers"
      loadingText="Searching providers…"
      inputValue={input}
      onInputChange={(_, val) => setInput(val)}
      onChange={(_, val) => {
        onChange(val);
        if (val) setInput(displayName(val));
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          margin="dense"
          label="Select Provider"
          placeholder="Type a provider's name…"
          helperText="Search by provider name."
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Avatar
              src={option.user?.avatarUrl ?? undefined}
              sx={{ width: 32, height: 32, flexShrink: 0 }}
            >
              {(option.user?.firstName?.[0] ?? "?").toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {displayName(option)}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                ID: {option.id}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    />
  );
}
