import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsCharts({ metrics }) {
  if (!metrics) return null;

  // Prepare Place (Constituency Wards) Data with Low, Medium, High Urgency groups
  const placeData = (metrics.constituency_counts || []).map(item => ({
    name: item.name,
    Low: item.low || 0,
    Medium: item.medium || 0,
    High: item.high || 0
  }));

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Grouped Urgency by Location Bar Chart */}
      <Grid item xs={12}>
        <Card sx={{ height: 450 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontFamily: "'Outfit', sans-serif" }}>
              Request Urgency Levels by Location (Wards)
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {placeData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No location data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={placeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={12} allowDecimals={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#1f2937' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="Low" fill="#10b981" radius={[4, 4, 0, 0]} name="Low Urgency" />
                    <Bar dataKey="Medium" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Medium Urgency" />
                    <Bar dataKey="High" fill="#ef4444" radius={[4, 4, 0, 0]} name="High Urgency" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
