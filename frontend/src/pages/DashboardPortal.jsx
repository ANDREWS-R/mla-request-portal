import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Toolbar,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';

import Navbar from '../components/Navbar';
import MetricsCards from '../components/MetricsCards';
import AnalyticsCharts from '../components/AnalyticsCharts';
import RequestDetailModal from '../components/RequestDetailModal';
import apiService from '../services/api';

const STATUS_COLORS = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  ESCALATED: 'error'
};

const URGENCY_COLORS = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error'
};

const CATEGORIES = {
  ROADS: 'Roads & Transport',
  WATER: 'Water Supply',
  ELECTRICITY: 'Electricity & Power',
  HEALTH: 'Healthcare & Sanitation',
  EDUCATION: 'Education & Schools',
  FINANCIAL_AID: 'Financial Aid',
  OTHER: 'Other'
};

export default function DashboardPortal({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Home, 1: Dashboard, 2: Request Queue, 3: Appointment Scheduler, 4: Staff Management
  
  const [metrics, setMetrics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const navigate = useNavigate();

  // Request Queue Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterAssignedMe, setFilterAssignedMe] = useState('');
  const [cleanView, setCleanView] = useState(false);

  // Appointments State
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [generatingDefaults, setGeneratingDefaults] = useState(false);
  const [showSlotsList, setShowSlotsList] = useState(false);
  
  // Create Slot Dialog
  const [createSlotOpen, setCreateSlotOpen] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('10:00');
  const [slotEndTime, setSlotEndTime] = useState('11:00');
  const [slotLimit, setSlotLimit] = useState(4);
  const [submittingSlot, setSubmittingSlot] = useState(false);

  // Reschedule Dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [targetAppointment, setTargetAppointment] = useState(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Selected Request Modal Details
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Staff creation Form Dialog
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);

  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, filterCategory, filterStatus, filterUrgency, filterAssignedMe, cleanView]);

  useEffect(() => {
    if (currentUser && activeTab === 2) {
      fetchAppointmentsData();
    }
  }, [currentUser, activeTab]);

  const fetchDashboardData = async () => {
    fetchMetrics();
    fetchRequests();
    if (currentUser && currentUser.role === 'MLA') {
      fetchStaffList();
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const showAssignedOnly = currentUser?.role === 'STAFF';
      const response = await apiService.getDashboardMetrics(showAssignedOnly);
      setMetrics(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const filters = {
        category: filterCategory,
        status: filterStatus,
        urgency: filterUrgency,
        assigned_to_me: filterAssignedMe === 'true' ? 'true' : '',
        search: searchTerm,
        clean_view: cleanView ? 'true' : ''
      };
      const data = await apiService.getRequests(filters);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const data = await apiService.getStaffList();
      setStaffList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointmentsData = async () => {
    setLoadingAppointments(true);
    try {
      const slotsData = await apiService.getAppointmentSlots();
      setSlots(slotsData);
      
      const apptsData = await apiService.getAppointments();
      setAppointments(apptsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleRowClick = (id) => {
    setSelectedRequestId(id);
    setDetailModalOpen(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffUsername || !staffPassword || !staffFirstName || !staffLastName) {
      alert('Please fill out all required fields.');
      return;
    }
    setCreatingStaff(true);
    try {
      await apiService.createStaff({
        username: staffUsername,
        password: staffPassword,
        email: staffEmail,
        first_name: staffFirstName,
        last_name: staffLastName
      });
      setStaffUsername('');
      setStaffPassword('');
      setStaffEmail('');
      setStaffFirstName('');
      setStaffLastName('');
      setAddStaffOpen(false);
      fetchStaffList();
      alert('Staff account created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create staff account.');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) return;
    setSubmittingSlot(true);
    try {
      await apiService.createAppointmentSlot({
        date: slotDate,
        start_time: slotStartTime,
        end_time: slotEndTime,
        max_appointments: slotLimit
      });
      setSlotDate('');
      setCreateSlotOpen(false);
      fetchAppointmentsData();
      alert('Slot added successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to create slot.');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleGenerateDefaults = async () => {
    const daysStr = prompt("Enter number of days to schedule slots for (10:00 to 16:00 office hours):", "7");
    if (daysStr === null) return;
    const days = parseInt(daysStr);
    if (isNaN(days) || days <= 0) {
      alert("Please enter a valid positive number of days.");
      return;
    }

    setGeneratingDefaults(true);
    try {
      const response = await apiService.generateDefaultSlots(days);
      alert(response.data?.message || 'Default weekly slots generated successfully.');
      fetchAppointmentsData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate slots.');
    } finally {
      setGeneratingDefaults(false);
    }
  };

  const handleCancelSlot = async (slotId) => {
    if (window.confirm("Cancel this slot? All bookings will be cancelled.")) {
      try {
        await apiService.cancelAppointmentSlot(slotId);
        fetchAppointmentsData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (window.confirm("Cancel this citizen appointment?")) {
      try {
        await apiService.cancelAppointment(apptId);
        fetchAppointmentsData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openRescheduleModal = (appt) => {
    setTargetAppointment(appt);
    setRescheduleNotes(`Rescheduled meeting of ${appt.slot_details.date}`);
    setRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleSlotId) return;
    setSubmittingReschedule(true);
    try {
      await apiService.rescheduleAppointment(targetAppointment.id, rescheduleSlotId, rescheduleNotes);
      setRescheduleOpen(false);
      setRescheduleSlotId('');
      setTargetAppointment(null);
      fetchAppointmentsData();
      alert('Appointment rescheduled.');
    } catch (err) {
      console.error(err);
      alert('Failed to reschedule.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fdfdfb' }}>
      
      {/* Top Navbar */}
      <Navbar user={currentUser} onLogout={handleLogout} />
      <Toolbar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* Navigation Tabs Bar */}
        <Paper sx={{ mb: 4, borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => setActiveTab(val)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} label="Dashboard" />
            <Tab icon={<ListAltIcon sx={{ fontSize: 18 }} />} label="Request Queue" />
            <Tab icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />} label="Appointment Scheduler" />
            {currentUser.role === 'MLA' && (
              <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} label="Staff Management" />
            )}
          </Tabs>
        </Paper>

        {/* Tab 0: Dashboard (Metrics cards & Analytics charts) */}
        {activeTab === 0 && (
          <Box>
            {loadingMetrics ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : (
              <Box>
                <MetricsCards metrics={metrics} />

                {/* Audit Oversight Banner */}
                <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
                  <Grid item xs={12}>
                    <Card sx={{ borderLeft: '5px solid #dc2626', backgroundColor: '#fef2f2' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">AI AUDIT OVERSIGHT</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {metrics?.spam_count || 0} Spam Items Flagged
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ad messages, link-spam, or gibberish entries set aside for queue cleanliness.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Analytics graphs */}
                <Box sx={{ mt: 2 }}>
                  <AnalyticsCharts metrics={metrics} />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Request Queue */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, fontFamily: "'Outfit', sans-serif" }}>
              Request Queue
            </Typography>

            {/* Filters Row */}
            <Paper sx={{ p: 2.5, mb: 4, border: '1px solid #e5e7eb' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="cat-filter-label">Category</InputLabel>
                    <Select
                      labelId="cat-filter-label"
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value=""><em>All Categories</em></MenuItem>
                      {Object.keys(CATEGORIES).map((key) => (
                        <MenuItem key={key} value={key}>{CATEGORIES[key]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value=""><em>All Statuses</em></MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="ESCALATED">Escalated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="urgency-filter-label">Urgency</InputLabel>
                    <Select
                      labelId="urgency-filter-label"
                      value={filterUrgency}
                      label="Urgency"
                      onChange={(e) => setFilterUrgency(e.target.value)}
                    >
                      <MenuItem value=""><em>All Urgency</em></MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Clean queue toggle */}
                <Grid item xs={12} sm={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={cleanView}
                        onChange={(e) => setCleanView(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FilterListIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" fontWeight="bold">Clean Queue View</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>

            {loadingRequests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} sx={{ border: '1px solid #e5e7eb' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell><strong>Citizen</strong></TableCell>
                      <TableCell><strong>Place</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Urgency</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Audit Tag</strong></TableCell>
                      <TableCell><strong>Submitted</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No requests found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...requests]
                        .sort((a, b) => a.id - b.id)
                        .map((row, index) => (
                        <TableRow
                          key={row.id}
                          onClick={() => handleRowClick(row.id)}
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { backgroundColor: '#f9fafb' },
                            backgroundColor: row.is_spam ? 'rgba(239, 68, 68, 0.05)' : row.is_duplicate ? 'rgba(245, 158, 11, 0.05)' : 'inherit'
                          }}
                        >
                          <TableCell>#{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{row.subject}</TableCell>
                          <TableCell>{row.submitter_name || 'Anonymous'}</TableCell>
                          <TableCell>{row.constituency}</TableCell>
                          <TableCell>{row.category === 'OTHER' && row.custom_category ? row.custom_category : (CATEGORIES[row.category] || row.category)}</TableCell>
                          <TableCell>
                            <Chip label={row.urgency} color={URGENCY_COLORS[row.urgency]} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={row.status} color={STATUS_COLORS[row.status]} size="small" />
                          </TableCell>
                          <TableCell>
                            {row.is_spam && <Chip label="Spam" color="error" size="small" variant="outlined" />}
                            {row.is_duplicate && <Chip label={`Duplicate (#${row.duplicate_of})`} color="warning" size="small" variant="outlined" />}
                            {!row.is_spam && !row.is_duplicate && <Chip label="Verified" color="success" size="small" variant="outlined" />}
                          </TableCell>
                          <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 3: Appointment Scheduler */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                Appointment Scheduler
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  color={showSlotsList ? "inherit" : "primary"}
                  onClick={() => setShowSlotsList(prev => !prev)}
                >
                  {showSlotsList ? "Hide Slots Config" : "Show Slots Config"}
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleGenerateDefaults}
                  disabled={generatingDefaults}
                  startIcon={generatingDefaults ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                >
                  Generate Default Slots
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AccessTimeIcon />}
                  onClick={() => setCreateSlotOpen(true)}
                >
                  Setup Direct Slot
                </Button>
                <IconButton onClick={fetchAppointmentsData} color="primary" sx={{ border: '1px solid #e5e7eb' }}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>

            {loadingAppointments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
            ) : (
              (() => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const activeReservations = appointments.filter(appt => appt.slot_details.date >= todayStr && appt.status === 'BOOKED');
                const historyReservations = appointments.filter(appt => appt.slot_details.date < todayStr || appt.status !== 'BOOKED');

                return (
                  <Grid container spacing={4}>
                    
                    {/* Slots List Configuration Panel */}
                    {showSlotsList && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#064e3b' }}>
                          Available Calendar Slots
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {slots.length === 0 ? (
                            <Paper sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                              No appointment slots configured yet.
                            </Paper>
                          ) : (
                            slots.map((slot) => (
                              <Paper 
                                key={slot.id} 
                                sx={{ 
                                  p: 2, 
                                  backgroundColor: slot.is_cancelled ? '#fef2f2' : '#ffffff',
                                  borderLeft: slot.is_cancelled ? '5px solid #ef4444' : '5px solid #064e3b',
                                  border: '1px solid #e5e7eb'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">{slot.date}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Time: {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Limit: {slot.max_appointments} per hour (Booked: {slot.bookings_count})
                                    </Typography>
                                  </Box>
                                  {!slot.is_cancelled && (
                                    <IconButton color="error" onClick={() => handleCancelSlot(slot.id)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                  {slot.is_cancelled && <Chip label="Cancelled" color="error" size="small" />}
                                </Box>
                              </Paper>
                            ))
                          )}
                        </Box>
                      </Grid>
                    )}

                    {/* Citizen Bookings & History Tables */}
                    <Grid item xs={12} md={showSlotsList ? 8 : 12}>
                      
                      {/* Active bookings */}
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#064e3b' }}>
                        Active Citizen Session Reservations
                      </Typography>
                      <TableContainer component={Paper} sx={{ border: '1px solid #e5e7eb', mb: 4 }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                            <TableRow>
                              <TableCell><strong>Date & Time</strong></TableCell>
                              <TableCell><strong>Citizen Details</strong></TableCell>
                              <TableCell><strong>Topic of Conversation</strong></TableCell>
                              <TableCell><strong>Status</strong></TableCell>
                              <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeReservations.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                  No active bookings registered.
                                </TableCell>
                              </TableRow>
                            ) : (
                              activeReservations.map((appt) => (
                                <TableRow key={appt.id}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{appt.slot_details.date}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {appt.slot_details.start_time.slice(0, 5)} - {appt.slot_details.end_time.slice(0, 5)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{appt.citizen_name_display}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">{appt.citizen_phone}</Typography>
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 200, wordWrap: 'break-word' }}>
                                    {appt.topic}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={appt.status} 
                                      color="primary"
                                      size="small" 
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                      <Button 
                                        size="small" 
                                        variant="outlined" 
                                        onClick={() => openRescheduleModal(appt)}
                                      >
                                        Reschedule
                                      </Button>
                                      <Button 
                                        size="small" 
                                        color="error" 
                                        variant="outlined"
                                        onClick={() => handleCancelAppointment(appt.id)}
                                      >
                                        Cancel
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Reservations history */}
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>
                        Past Bookings & Cancelled Reservations History
                      </Typography>
                      <TableContainer component={Paper} sx={{ border: '1px solid #e5e7eb' }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f9fafb' }}>
                            <TableRow>
                              <TableCell><strong>Date & Time</strong></TableCell>
                              <TableCell><strong>Citizen Details</strong></TableCell>
                              <TableCell><strong>Topic of Conversation</strong></TableCell>
                              <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {historyReservations.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                  No past or cancelled bookings in history logs.
                                </TableCell>
                              </TableRow>
                            ) : (
                              historyReservations.map((appt) => (
                                <TableRow key={appt.id}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>{appt.slot_details.date}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {appt.slot_details.start_time.slice(0, 5)} - {appt.slot_details.end_time.slice(0, 5)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{appt.citizen_name_display}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">{appt.citizen_phone}</Typography>
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 200, wordWrap: 'break-word', color: 'text.secondary' }}>
                                    {appt.topic}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={appt.status} 
                                      color={appt.status === 'CANCELLED' ? 'error' : 'secondary'} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                    </Grid>

                  </Grid>
                );
              })()
            )}
          </Box>
        )}

        {/* Tab 4: Staff Management (MLA only) */}
        {activeTab === 3 && currentUser.role === 'MLA' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "'Outfit', sans-serif" }}>
                Staff Management
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />} 
                onClick={() => setAddStaffOpen(true)}
              >
                Add Staff Member
              </Button>
            </Box>

            <Grid container spacing={3}>
              {staffList.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    No staff members registered.
                  </Paper>
                </Grid>
              ) : (
                staffList.map((staff) => (
                  <Grid item xs={12} sm={6} md={4} key={staff.id}>
                    <Paper sx={{ p: 3, border: '1px solid #e5e7eb' }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {staff.first_name} {staff.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Username:</strong> {staff.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Email:</strong> {staff.email || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Constituency:</strong> {staff.profile?.constituency || 'All'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}

      </Container>

      {/* Request Details Dialog */}
      <RequestDetailModal
        open={detailModalOpen}
        requestId={selectedRequestId}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRequestId(null);
        }}
        staffList={staffList}
        onUpdateSuccess={fetchRequests}
        userRole={currentUser.role}
      />

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onClose={() => setAddStaffOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(6, 78, 59, 0.08)', fontWeight: 'bold' }}>
          Register Office Staff Account
        </DialogTitle>
        <form onSubmit={handleCreateStaff}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, backgroundColor: '#ffffff' }}>
            <TextField
              required
              fullWidth
              label="Username"
              value={staffUsername}
              onChange={(e) => setStaffUsername(e.target.value)}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
            />
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={staffFirstName}
                onChange={(e) => setStaffFirstName(e.target.value)}
              />
              <TextField
                required
                fullWidth
                label="Last Name"
                value={staffLastName}
                onChange={(e) => setStaffLastName(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddStaffOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={creatingStaff}>
              {creatingStaff ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create Slot Dialog */}
      <Dialog open={createSlotOpen} onClose={() => setCreateSlotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(6, 78, 59, 0.08)', fontWeight: 'bold' }}>
          Configure Direct Session Slot
        </DialogTitle>
        <form onSubmit={handleCreateSlot}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1, backgroundColor: '#ffffff' }}>
            <TextField
              required
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                required
                fullWidth
                type="time"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                value={slotStartTime}
                onChange={(e) => setSlotStartTime(e.target.value)}
              />
              <TextField
                required
                fullWidth
                type="time"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                value={slotEndTime}
                onChange={(e) => setSlotEndTime(e.target.value)}
              />
            </Box>
            <TextField
              required
              fullWidth
              type="number"
              label="Hourly Capacity (Persons)"
              value={slotLimit}
              onChange={(e) => setSlotLimit(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateSlotOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submittingSlot}>
              {submittingSlot ? <CircularProgress size={24} /> : 'Setup Slot'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reschedule Booking Dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'rgba(217, 119, 6, 0.08)', fontWeight: 'bold' }}>
          Reschedule Citizen Session
        </DialogTitle>
        <form onSubmit={handleRescheduleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1, backgroundColor: '#ffffff' }}>
            <Typography variant="body2">
              Citizen: <strong>{targetAppointment?.citizen_name_display}</strong> <br />
              Current Slot: {targetAppointment?.slot_details.date} ({targetAppointment?.slot_details.start_time.slice(0, 5)})
            </Typography>
            
            <FormControl fullWidth required>
              <InputLabel id="resch-slot-label">Select Target Slot</InputLabel>
              <Select
                labelId="resch-slot-label"
                value={rescheduleSlotId}
                label="Select Target Slot"
                onChange={(e) => setRescheduleSlotId(e.target.value)}
              >
                <MenuItem value=""><em>Select a Slot</em></MenuItem>
                {slots.filter(s => !s.is_cancelled && s.id !== targetAppointment?.slot).map((slot) => {
                  const currentBookings = slot.bookings_count || 0;
                  const isFull = currentBookings >= slot.max_appointments;
                  return (
                    <MenuItem key={slot.id} value={slot.id} disabled={isFull}>
                      📅 {slot.date} | ⏰ {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Rescheduling Note"
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRescheduleOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={submittingReschedule}>
              {submittingReschedule ? <CircularProgress size={24} /> : 'Reschedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
