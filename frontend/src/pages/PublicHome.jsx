import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

import PublicHeader from '../components/PublicHeader';
import apiService from '../services/api';

export default function PublicHome() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const response = await apiService.getPublicMetrics();
      setMetrics(response.data);
    } catch (err) {
      console.error('Failed to fetch public metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fdfdfb' }}>
      
      {/* Government Navigation Header */}
      <PublicHeader />

      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', 
        color: '#ffffff', 
        py: { xs: 8, md: 10 }, 
        position: 'relative',
        borderBottom: '4px solid #d97706',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(217, 119, 6, 0.08) 0%, transparent 40%)'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h2" component="h1" fontWeight="bold" sx={{ 
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.2,
                mb: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}>
                MLA Citizen Grievance Portal
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 'normal', lineHeight: 1.6 }}>
                Welcome to the digital constituency office of the Member of Legislative Assembly (MLA). Registered citizens can file official grievances, submit local suggestions, and request direct appointment slot bookings.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ py: 1.5, px: 4, fontSize: '1rem', fontWeight: 'bold' }}
                >
                  File Grievance / Book Slot
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  onClick={() => navigate('/analytics')}
                  sx={{ py: 1.5, px: 4, fontSize: '1rem', border: '2px solid rgba(255,255,255,0.4)', '&:hover': { border: '2px solid #ffffff', backgroundColor: 'rgba(255,255,255,0.05)' } }}
                >
                  View Budgets Analytics
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box 
                component="img"
                src="/hero.jpg"
                alt="Constituency Services Illustration"
                sx={{
                  width: '100%',
                  maxHeight: 420,
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '4px solid #ffffff',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* About features block */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" fontWeight="bold" sx={{ mb: 1, fontFamily: "'Outfit', sans-serif" }}>
          How the Digital Portal Works
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
          This portal utilizes advanced technologies to simplify grievance classification, translate local languages, and optimize office appointment slots.
        </Typography>

        <Grid container spacing={4}>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(6, 78, 59, 0.08)', 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5
                }}>
                  <AssignmentIcon sx={{ fontSize: 30 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  1. Submit Grievance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Log in as a citizen to write complaints, upload photo evidence, or record Malayalam voice notes. The portal automatically transcribes audio.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(6, 78, 59, 0.08)', 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5
                }}>
                  <TravelExploreIcon sx={{ fontSize: 30 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  2. AI Queue Routing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Our AI pipeline translates submissions, estimates urgency levels, categories the complaint (Roads, Water, Electricity), and routes it to the designated staff officer.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(6, 78, 59, 0.08)', 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5
                }}>
                  <GroupsIcon sx={{ fontSize: 30 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  3. In-Person Meeting
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  If you need a direct meeting, view the MLA's open slot scheduler. Book a guaranteed meeting time. Capacity is limited to 3-4 appointments per hour.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Call to action */}
        <Box sx={{ mt: 8, p: 5, borderRadius: 4, background: 'linear-gradient(135deg, #f4f6f0 0%, #eef0ea 100%)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#064e3b', mb: 1.5, fontFamily: "'Outfit', sans-serif" }}>
            Ready to interact with your MLA Office?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, maxWidth: 500, mx: 'auto' }}>
            Register your Citizen Profile or Sign In using your username credentials.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={() => navigate('/login')}
            sx={{ px: 5, py: 1.2 }}
          >
            Go to Login & Register Page
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#022c22', color: '#94a3b8', py: 4, mt: 8, borderTop: '4px solid #d97706' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="body2" gutterBottom>
            © 2026 Aluva Constituency MLA Office. Official Public Portal.
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Designed for governance transparency and efficient citizen-office interactions.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}
