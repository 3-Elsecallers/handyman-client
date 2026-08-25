'use client';

import { useRouter } from 'next/navigation';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const features = [
  {
    title: 'Book Trusted Pros',
    description:
      'Find vetted professionals for every household job and book them in minutes.',
  },
  {
    title: 'Grow Your Business',
    description:
      'Providers reach new customers and manage their work through one platform.',
  },
  {
    title: 'Secure & Reliable',
    description:
      'Verified accounts and protected payments keep every booking worry-free.',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Handyman
          </Typography>
          <Button color="primary" onClick={() => router.push('/sign-in')}>
            Sign In
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 8 },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            Home services, done right.
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 5 }}>
            Handyman connects homeowners with trusted professionals for repairs,
            maintenance and improvements — booked, tracked and paid for in one place.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Button
              size="large"
              variant="contained"
              color="primary"
              onClick={() => router.push('/sign-up/customer')}
            >
              Sign Up as Customer
            </Button>
            <Button
              size="large"
              variant="outlined"
              color="primary"
              onClick={() => router.push('/sign-up/provider')}
            >
              Become a Provider
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            pb: 10,
          }}
        >
          {features.map((feature) => (
            <Card key={feature.title} variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
