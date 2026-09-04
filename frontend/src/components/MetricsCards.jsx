import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AllInboxIcon from '@mui/icons-material/AllInbox';

export default function MetricsCards({ metrics }) {
  if (!metrics) return null;
  const counts = metrics.status_counts || {};

  const cardData = [
    {
      title: 'Total Requests',
      value: metrics.total_requests || 0,
      icon: <AllInboxIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.2)',
    },
    {
      title: 'Pending',
      value: counts.PENDING || 0,
      icon: <PendingActionsIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
    },
    {
      title: 'In Progress',
      value: counts.IN_PROGRESS || 0,
      icon: <AutorenewIcon sx={{ fontSize: 32, color: '#3b82f6' }} />,
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
    },
    {
      title: 'Resolved',
      value: counts.RESOLVED || 0,
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
    },
    {
      title: 'Escalated',
      value: counts.ESCALATED || 0,
      icon: <WarningAmberIcon sx={{ fontSize: 32, color: '#ef4444' }} />,
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cardData.map((card, idx) => (
        <Grid item xs={12} sm={6} md={2.4} key={idx}>
          <Card sx={{ 
            backgroundColor: card.bg, 
            borderColor: card.border,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <CardContent sx={{ p: '20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 3, 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
