import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SpeedIcon from '@mui/icons-material/Speed';

import PublicHeader from '../components/PublicHeader';
import apiService from '../services/api';

const COLORS = ['#064e3b', '#d97706', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6'];

const CATEGORY_LABELS = {
  ROADS: 'Roads & Transport',
  WATER: 'Water Supply',
  ELECTRICITY: 'Electricity & Power',
  HEALTH: 'Healthcare & Sanitation',
  EDUCATION: 'Education & Schools',
  FINANCIAL_AID: 'Financial Aid',
  OTHER: 'Other'
};

const KERALA_CONSTITUENCIES = [
  'Aluva', 'Trivandrum', 'Ernakulam', 'Kozhikode', 'Thrissur', 
  'Palakkad', 'Kannur', 'Malappuram', 'Kollam', 'Kottayam', 
  'Wayanad', 'Idukki', 'Kasaragod', 'Pathanamthitta'
];

export default function DetailedAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(''); // Empty means "All"
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiService.getPublicMetrics();
      setMetrics(response.data);
    } catch (err) {
      console.error(err);
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

  // Combine dynamic constituencies with the static Kerala list to ensure complete options representation
  const constituenciesList = Array.from(
    new Set([
      ...KERALA_CONSTITUENCIES,
      ...(metrics?.projects_budget?.map((p) => p.constituency).filter(Boolean) || [])
    ])
  ).sort();

  // Filter projects list dynamically based on search, category, and selected place
  const filteredProjects = metrics?.projects_budget?.filter((project) => {
    const matchesSearch = project.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoryKeyMatch = filterCategory === '' || project.category === filterCategory;
    const categoryLabelMatch = filterCategory === '' || 
      (project.category && project.category.toLowerCase().includes(filterCategory.toLowerCase())) || 
      (CATEGORY_LABELS[project.category] && CATEGORY_LABELS[project.category].toLowerCase().includes(filterCategory.toLowerCase()));
    
    const matchesCategory = categoryKeyMatch || categoryLabelMatch;
    
    const matchesPlace = selectedPlace === '' || project.constituency === selectedPlace;
    return matchesSearch && matchesCategory && matchesPlace;
  }) || [];

  // Compute dynamic aggregates from filtered projects list
  const totalAllocated = filteredProjects.reduce((sum, p) => sum + (p.allocated || 0), 0);
  const totalSpent = filteredProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const avgResolutionTime = filteredProjects.length > 0
    ? (filteredProjects.reduce((sum, p) => sum + (p.time_days || 0), 0) / filteredProjects.length).toFixed(1)
    : 0;

  // Compute dynamic Category Counts based on filtered projects list for the PieChart
  const categoryCountsMap = {};
  filteredProjects.forEach((p) => {
    const label = CATEGORY_LABELS[p.category] || p.category;
    categoryCountsMap[label] = (categoryCountsMap[label] || 0) + 1;
  });
  const dynamicCategoryCounts = Object.keys(categoryCountsMap).map((key) => ({
    label: key,
    count: categoryCountsMap[key]
  }));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fdfdfb' }}>
      
      {/* Public Header */}
      <PublicHeader />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif", mb: 1 }}>
            Development Budgets & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Inspect municipal infrastructure budgets, actual fund utilization, and average grievance resolution timelines across Kerala.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={4}>
            
            {/* Filter controls row */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2.5, border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="category-filter-select">Filter by Category</InputLabel>
                      <Select
                        labelId="category-filter-select"
                        value={filterCategory}
                        label="Filter by Category"
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <MenuItem value=""><em>All Categories</em></MenuItem>
                        {Object.keys(CATEGORY_LABELS).map((k) => (
                          <MenuItem key={k} value={k}>{CATEGORY_LABELS[k]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="place-filter-select">Constituency / Place</InputLabel>
                      <Select
                        labelId="place-filter-select"
                        value={selectedPlace}
                        label="Constituency / Place"
                        onChange={(e) => {
                          setSelectedPlace(e.target.value);
                          setVisibleCount(5); // Reset pagination on filter change
                        }}
                      >
                        <MenuItem value=""><em>Whole Kerala (All Districts)</em></MenuItem>
                        {constituenciesList.map((p, idx) => (
                          <MenuItem key={idx} value={p}>{p}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Aggregate Metrics Row */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: '6px solid #064e3b' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#064e3b' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" block>Total Allocated Budget</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(totalAllocated)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: '6px solid #d97706' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <QueryStatsIcon sx={{ fontSize: 40, color: '#d97706' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" block>Budget Spent Utilisation</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(totalSpent)} ({totalAllocated > 0 ? (totalSpent / totalAllocated * 100).toFixed(0) : 0}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: '6px solid #10b981' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SpeedIcon sx={{ fontSize: 40, color: '#10b981' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" block>Average Resolution Time</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {avgResolutionTime} Days
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Graphs Column */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#064e3b', mb: 2 }}>
                    Funding Breakdown Categories (Counts)
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    {dynamicCategoryCounts.length === 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                        No data to display in chart
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dynamicCategoryCounts}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="label"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {dynamicCategoryCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#064e3b', mb: 2 }}>
                    Allocated vs Spent Projects Funding (₹)
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    {filteredProjects.length === 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                        No data to display in chart
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredProjects} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="project" fontSize={10} stroke="#64748b" tickFormatter={(t) => t.split(' ').slice(0, 2).join(' ')} />
                          <YAxis fontSize={10} stroke="#64748b" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          <Bar dataKey="allocated" name="Allocated" fill="#064e3b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="spent" name="Actual Spent" fill="#d97706" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Project List Table */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                  Project Allocation Audit Ledger
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing {Math.min(visibleCount, filteredProjects.length)} of {filteredProjects.length} items for {selectedPlace || 'all Kerala constituencies'}.
                </Typography>
              </Box>

              <TableContainer component={Paper} sx={{ border: '1px solid #e5e7eb' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell><strong>Project Name / Grievance</strong></TableCell>
                      <TableCell><strong>Constituency</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell align="right"><strong>Allocated Budget</strong></TableCell>
                      <TableCell align="right"><strong>Amount Spent</strong></TableCell>
                      <TableCell align="right"><strong>Avg. Resolution</strong></TableCell>
                      <TableCell align="right"><strong>Year</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No projects match the filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...filteredProjects]
                        .sort((a, b) => a.id - b.id)
                        .slice(0, visibleCount)
                        .map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{row.project}</TableCell>
                          <TableCell><Chip label={row.constituency || 'Kerala'} size="small" variant="outlined" /></TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                            {formatCurrency(row.allocated)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 'medium' }}>
                            {formatCurrency(row.spent)}
                          </TableCell>
                          <TableCell align="right">{row.time_days} Days</TableCell>
                          <TableCell align="right">{row.financial_year || '2025-2026'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredProjects.length > visibleCount && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    sx={{ px: 5, py: 1, fontWeight: 'bold', borderRadius: 2 }}
                  >
                    Show More
                  </Button>
                </Box>
              )}
            </Grid>

          </Grid>
        )}
      </Container>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#022c22', color: '#94a3b8', py: 4, mt: 8, borderTop: '4px solid #d97706' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="body2" gutterBottom>
            © 2026 Kerala Constituencies Development Transparency Initiative.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}
