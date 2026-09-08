'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { getCompanyWallet } from "@/api/payment.api";

export default function FinanceDashboardPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("GHS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await getCompanyWallet();
      if (response?.status === 200 && response.data.data) {
        setBalance(response.data.data.balance ?? 0);
        setCurrency(response.data.data.currency);
      } else {
        setError(response?.data?.message || "Failed to load company wallet.");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Finance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Platform finance overview and wallet.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ maxWidth: 420, mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Company Wallet Balance
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              GH₵ {(balance ?? 0).toFixed(2)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {currency}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Jump to
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          component={Link}
          href="/admin/dashboard/finance/ledger"
        >
          Ledger
        </Button>
        <Button
          variant="outlined"
          component={Link}
          href="/admin/dashboard/finance/accounts"
        >
          Accounts
        </Button>
        <Button
          variant="outlined"
          component={Link}
          href="/admin/dashboard/finance/withdrawals"
        >
          Withdrawals
        </Button>
      </Box>
    </Box>
  );
}
