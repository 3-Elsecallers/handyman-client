'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getCatalogCategories, getCatalogServices } from '@/api/provider.api';
import type { ServiceCategory, CatalogService } from '@/types/provider';

export default function BrowseServicesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadingCategories(true);
        const response = await getCatalogCategories();
        if (response?.status === 200 && response.data.data) {
          setCategories(response.data.data);
        } else {
          setError('Failed to load categories.');
        }
      } catch {
        setError('Failed to load categories.');
      } finally {
        setLoadingCategories(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoadingServices(true);
        setError(null);
        const response = await getCatalogServices(selectedCategoryId || undefined);
        if (response?.status === 200 && response.data.data) {
          setServices(response.data.data);
        } else {
          setError('Failed to load services.');
        }
      } catch {
        setError('Failed to load services.');
      } finally {
        setLoadingServices(false);
      }
    }
    load();
  }, [selectedCategoryId]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  const handleAddToMyServices = () => {
    router.push('/provider/dashboard/my-services');
  };

  if (loadingCategories) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Browse Catalog
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }} size="small">
        <InputLabel id="category-filter-label">Filter by Category</InputLabel>
        <Select
          labelId="category-filter-label"
          value={selectedCategoryId}
          label="Filter by Category"
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <MenuItem value="">
            <em>All Categories</em>
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadingServices ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      ) : services.length === 0 ? (
        <Alert severity="info">No services found.</Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {services.map((service) => (
            <Card key={service.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {service.name}
                </Typography>

                <Chip label={service.category?.name ?? 'Uncategorized'} size="small" sx={{ mb: 1 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {service.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    ${service.basePrice}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.durationMins} min
                  </Typography>
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddToMyServices}
                >
                  Add to My Services
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
