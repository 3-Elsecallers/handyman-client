'use client';

import { useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { requestTestUploadUrl, getTestImage } from "@/api/provider.api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProviderTestPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`);
      return;
    }

    void handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploaded(false);
    setError(null);
    setStatus(null);
    setImageUrl(null);

    const urlsRes = await requestTestUploadUrl();
    if (urlsRes?.status !== 200 || !urlsRes?.data?.data?.uploadUrl) {
      setError("Failed to get upload URL. Please try again.");
      setUploading(false);
      return;
    }

    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", urlsRes.data.data.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setStatus("Image uploaded successfully.");
      setUploaded(true);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleDisplay = async () => {
    setError(null);
    setStatus(null);

    const res = await getTestImage();
    if (res?.status !== 200 || !res.data) {
      setError("Failed to load image from server.");
      return;
    }

    const blob = res.data as Blob;
    setImageUrl(URL.createObjectURL(blob));
    setStatus("Image loaded from server.");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Test
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload an image to LocalStack S3 and view it fetched back from the server.
      </Typography>

      <Card sx={{ maxWidth: 520 }}>
        <CardContent>
          <Stack spacing={2}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handleDisplay}
              disabled={uploading || !uploaded}
            >
              Display from Server
            </Button>

            {uploading && <CircularProgress size={24} />}
            {status && <Alert severity="success">{status}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            {imageUrl && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
