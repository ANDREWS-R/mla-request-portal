import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Toolbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';

import Navbar from '../components/Navbar';
import AudioRecorder from '../components/AudioRecorder';
import RequestDetailModal from '../components/RequestDetailModal';
import apiService from '../services/api';

const STATUS_STEPS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  ESCALATED: 1
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

const URGENCY_CHIPS = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' }
};

export default function CitizenDashboard({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // 1. Submit Grievance State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [category, setCategory] = useState('ROADS');
  const [customCategory, setCustomCategory] = useState('');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [grievanceSuccess, setGrievanceSuccess] = useState(null);

  // 2. Booking State
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(''); // Selected date from calendar picker
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // 3. Statuses History State
  const [myRequests, setMyRequests] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setBookingName(`${user.first_name} ${user.last_name}`.trim() || user.username);
      setBookingPhone(user.profile?.phone || '');
      setFullName(`${user.first_name} ${user.last_name}`.trim() || user.username);
      setEmail(user.email || '');
      setPhone(user.profile?.phone || '');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSlots();
      fetchHistory();
    }
  }, [currentUser, activeTab]);

  const fetchSlots = async () => {
    try {
      const slotsData = await apiService.getAppointmentSlots();
      setSlots(slotsData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const reqs = await apiService.getRequests();
      setMyRequests(reqs);
      
      const appts = await apiService.getAppointments();
      setMyAppointments(appts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  // Grievance Submit
  const handleAudioRecorded = (file) => setAudioFile(file);
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleGrievanceSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !aadhaar.trim()) {
      setAlertMsg({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }
    if (!description.trim() && !audioFile) {
      setAlertMsg({ type: 'error', text: 'Please provide either a Written Description (preferred) or a Voice Recording.' });
      return;
    }
    if (category === 'OTHER' && !customCategory.trim()) {
      setAlertMsg({ type: 'error', text: 'Please specify the other department name.' });
      return;
    }

    setSubmittingGrievance(true);
    setAlertMsg({ type: '', text: '' });

    const finalDescription = `${description.trim()}\n\n--- Verification Info ---\nAddress/Ward: ${address.trim()}\nAadhaar Last 4 Digits: ${aadhaar.trim()}`;
    const categoryLabel = CATEGORIES[category] || category;
    const generatedSubject = category === 'OTHER' && customCategory ? `Grievance - ${customCategory.trim()}` : `Grievance - ${categoryLabel}`;

    const formData = new FormData();
    formData.append('subject', generatedSubject);
    formData.append('description', finalDescription);
    formData.append('submitter_name', fullName);
    formData.append('submitter_email', email);
    formData.append('submitter_phone', phone);
    formData.append('constituency', currentUser.profile?.constituency || 'Aluva');
    formData.append('category', category);
    if (category === 'OTHER') {
      formData.append('custom_category', customCategory.trim());
    }

    if (audioFile) formData.append('voice_file', audioFile);
    if (attachment) formData.append('attachment_file', attachment);

    try {
      const response = await apiService.submitCitizenRequest(formData);
      setGrievanceSuccess(response.data);
      setSubject('');
      setDescription('');
      setAddress('');
      setAadhaar('');
      setCategory('ROADS');
      setCustomCategory('');
      setAudioFile(null);
      setAttachment(null);
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Failed to submit grievance. Please try again.' });
    } finally {
      setSubmittingGrievance(false);
    }
  };

  // Appointment Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setAlertMsg({ type: 'error', text: 'Please select an available appointment slot.' });
      return;
    }
    if (!bookingTopic.trim()) {
      setAlertMsg({ type: 'error', text: 'Please state the meeting purpose.' });
      return;
    }

    setSubmittingBooking(true);
    setAlertMsg({ type: '', text: '' });

    try {
      await apiService.bookAppointment({
        slot: selectedSlotId,
        citizen_name: bookingName,
        citizen_phone: bookingPhone,
        topic: bookingTopic
      });
      setBookingTopic('');
      setSelectedSlotId('');
      fetchSlots();
      setAlertMsg({ type: 'success', text: 'Appointment booked successfully! Track its status in the history tab.' });
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Slot is fully booked. Please select another slot.' });
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await apiService.cancelAppointment(id);
        fetchHistory();
        setAlertMsg({ type: 'success', text: 'Appointment cancelled.' });
      } catch (err) {
        console.error(err);
        alert('Failed to cancel appointment.');
      }
    }
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fdfdfb' }}>
      
      {/* Dynamic Header Navbar */}
      <Navbar user={currentUser} onLogout={handleLogout} />
      <Toolbar />

      <Container maxWidth="lg" sx={{ pt: 0.5, pb: 2 }}>
        
        {/* Navigation Tabs */}
        <Paper sx={{ mb: 1, borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => {
              setActiveTab(val);
              setAlertMsg({ type: '', text: '' });
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="✍️ Request Grievance" />
            <Tab label="📅 Book Appointment" />
          </Tabs>
        </Paper>

        {alertMsg.text && (
          <Alert severity={alertMsg.type} sx={{ mb: 1, py: 0.5, borderRadius: 1.5 }}>
            {alertMsg.text}
          </Alert>
        )}

        {/* Tab 0: Grievance Submission & Statuses Split Layout */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {/* Left Column: Compact Grievance Form */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#064e3b', fontFamily: "'Outfit', sans-serif" }}>
                  New Grievance Filing
                </Typography>

                <form onSubmit={handleGrievanceSubmit} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Grid container spacing={1}>
                    {/* Submitter Verification Section */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        label="Submitter Full Name"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        label="Email Address"
                        placeholder="Email (Optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        label="Contact Phone"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        label="Home Address / Ward Number"
                        placeholder="Provide your physical address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        label="Aadhaar Card Last 4 Digits"
                        placeholder="e.g. 8832"
                        inputProps={{ maxLength: 4 }}
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={category === 'OTHER' ? 6 : 12}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel id="category-select-label">Department / Sector</InputLabel>
                        <Select
                          labelId="category-select-label"
                          id="category-select"
                          value={category}
                          label="Department / Sector"
                          onChange={(e) => {
                            setCategory(e.target.value);
                            if (e.target.value !== 'OTHER') {
                              setCustomCategory('');
                            }
                          }}
                        >
                          {Object.entries(CATEGORIES).map(([key, label]) => (
                            <MenuItem key={key} value={key}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {category === 'OTHER' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          label="Specify Other Department"
                          placeholder="e.g. Agriculture, Tourism"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        />
                      </Grid>
                    )}


                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Detailed Description (Written Description Preferred)"
                        placeholder="Provide description (either written here or voice message below is required)."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </Grid>
                    
                    {/* Voice Recording */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block', color: '#064e3b' }}>
                        Voice Grievance Message (Optional)
                      </Typography>
                      <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                    </Grid>

                    {/* File Attachment */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block', color: '#064e3b' }}>
                        Evidence Attachment (Optional)
                      </Typography>
                      <Box sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        backgroundColor: '#f9fafb',
                        border: '1px dashed #cbd5e1',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1.5,
                        justifyContent: 'center',
                        minHeight: 52
                      }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          color="secondary"
                          size="small"
                        >
                          Select File
                          <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </Button>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.75rem' }}>
                          {attachment ? `Selected: ${attachment.name}` : 'Select file.'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 0.5, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="medium"
                        endIcon={submittingGrievance ? null : <SendIcon />}
                        disabled={submittingGrievance}
                        sx={{ px: 4, py: 0.75 }}
                      >
                        {submittingGrievance ? <CircularProgress size={20} color="inherit" /> : 'File Request'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>

            {/* Right Column: Grievance Status List Tracker */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#064e3b', fontFamily: "'Outfit', sans-serif" }}>
                    ✍️ My Grievance Statuses
                  </Typography>
                  <Button size="small" startIcon={<RefreshIcon />} onClick={fetchHistory} variant="outlined">Refresh</Button>
                </Box>

                {loadingHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, flexGrow: 1, alignItems: 'center' }}><CircularProgress /></Box>
                ) : (
                  <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', pr: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {myRequests.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        No grievances filed yet.
                      </Paper>
                    ) : (
                      [...myRequests]
                        .sort((a, b) => a.id - b.id)
                        .map((req, index) => (
                        <Paper 
                          key={req.id} 
                          sx={{ 
                            p: 2, 
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box sx={{ maxWidth: '75%' }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ wordBreak: 'break-word' }}>#{index + 1}: {req.subject}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Filed: {new Date(req.created_at).toLocaleDateString()} | Category: {req.category === 'OTHER' && req.custom_category ? req.custom_category : (CATEGORIES[req.category] || req.category)}
                              </Typography>
                              <Typography variant="caption" color="primary.main" fontWeight="bold" display="block" sx={{ mt: 0.5 }}>
                                Reviewer: {req.assigned_staff_name || 'Not Assigned'}
                              </Typography>
                            </Box>
                            <Chip 
                              label={req.urgency} 
                              color={URGENCY_CHIPS[req.urgency]?.color} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
                            Workflow Progression:
                          </Typography>
                          <Stepper activeStep={STATUS_STEPS[req.status]} alternativeLabel size="small" sx={{ '& .MuiStepLabel-label': { fontSize: '0.65rem' } }}>
                            <Step key="Submit">
                              <StepLabel>Submitted</StepLabel>
                            </Step>
                            <Step key="Assign">
                              <StepLabel error={req.status === 'ESCALATED'}>
                                {req.status === 'ESCALATED' ? 'Escalated' : 'Under Review'}
                              </StepLabel>
                            </Step>
                            <Step key="Resolve">
                              <StepLabel>Resolved</StepLabel>
                            </Step>
                          </Stepper>
                        </Paper>
                      ))
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Book Appointment & Statuses Split Layout */}
        {activeTab === 1 && (
          <Grid container spacing={2}>
            {/* Left Column: Compact Appointment Scheduler Form */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#064e3b', fontFamily: "'Outfit', sans-serif" }}>
                  New Appointment Booking
                </Typography>

                <form onSubmit={handleBookingSubmit} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          label="Full Name"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          label="Contact Phone"
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                    
                    {/* Step 2: Date Selection Part */}
                    <Box>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: '#064e3b', mb: 1, display: 'block' }}>
                        1. Select Date from Calendar Grid:
                      </Typography>
                      
                      {slots.filter(s => !s.is_cancelled).length === 0 ? (
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                          <Typography variant="caption" color="error" fontWeight="bold">
                            No appointment sessions are currently scheduled by the MLA office.
                          </Typography>
                        </Paper>
                      ) : (
                        <Grid container spacing={1}>
                          {Array.from(new Set(slots.filter(s => !s.is_cancelled).map(s => s.date))).sort().map((dateStr) => {
                            const daySlots = slots.filter(s => !s.is_cancelled && s.date === dateStr);
                            const isAnyAvailable = daySlots.some(s => (s.max_appointments - (s.bookings_count || 0)) > 0);
                            const isSelected = selectedDate === dateStr;
                            
                            return (
                              <Grid item xs={4} sm={3} key={dateStr}>
                                <Box
                                  onClick={() => {
                                    setSelectedDate(dateStr);
                                    setSelectedSlotId(''); // Reset selected time
                                  }}
                                  sx={{
                                    p: 1,
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    border: isSelected 
                                      ? '2px solid #064e3b' 
                                      : isAnyAvailable 
                                        ? '1.5px solid #10b981' 
                                        : '1.5px solid #dc2626',
                                    backgroundColor: isSelected 
                                      ? 'rgba(6, 78, 59, 0.08)' 
                                      : isAnyAvailable 
                                        ? '#f0fdf4' 
                                        : '#fef2f2',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: '#064e3b',
                                      backgroundColor: 'rgba(6, 78, 59, 0.04)'
                                    }
                                  }}
                                >
                                  <Typography variant="caption" fontWeight="bold" sx={{ color: isSelected ? '#064e3b' : isAnyAvailable ? '#10b981' : '#dc2626', display: 'block', fontSize: '0.75rem' }}>
                                    {dateStr}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', display: 'block', mt: 0.5, color: isAnyAvailable ? '#10b981' : '#dc2626', fontWeight: 'bold' }}>
                                    {isAnyAvailable ? '🟢 Open' : '🔴 Full'}
                                  </Typography>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Box>

                    {/* Step 3: Time Selection Part (Show only after selecting a Date) */}
                    {selectedDate && (
                      <Box>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#064e3b', mb: 1, display: 'block' }}>
                          2. Available Times on {selectedDate}:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {slots
                            .filter(s => !s.is_cancelled && s.date === selectedDate)
                            .map((slot) => {
                              const activeBookings = slot.bookings_count || 0;
                              const seatsLeft = slot.max_appointments - activeBookings;
                              const isFull = seatsLeft <= 0;
                              const isSelected = selectedSlotId === slot.id;
                              
                              return (
                                <Grid item xs={6} sm={4} key={slot.id}>
                                  <Box
                                    onClick={() => {
                                      if (!isFull) {
                                        setSelectedSlotId(slot.id);
                                      }
                                    }}
                                    sx={{
                                      p: 1,
                                      borderRadius: 1.5,
                                      cursor: isFull ? 'not-allowed' : 'pointer',
                                      textAlign: 'center',
                                      border: isSelected 
                                        ? '2px solid #064e3b' 
                                        : isFull 
                                          ? '1.5px solid #dc2626' 
                                          : '1.5px solid #10b981',
                                      backgroundColor: isSelected 
                                        ? 'rgba(6, 78, 59, 0.08)' 
                                        : isFull 
                                          ? '#fef2f2' 
                                          : '#f0fdf4',
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        borderColor: isFull ? '#dc2626' : '#064e3b',
                                        backgroundColor: isFull ? '#fef2f2' : 'rgba(16, 185, 129, 0.08)'
                                      }
                                    }}
                                  >
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: isFull ? '#dc2626' : '#064e3b', fontSize: '0.75rem', display: 'block' }}>
                                      ⏰ {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', color: isFull ? '#dc2626' : '#10b981', fontWeight: 'bold', fontSize: '0.65rem' }}>
                                      {isFull ? '🔴 Full (0/4)' : `🟢 Open (${seatsLeft} left)`}
                                    </Typography>
                                  </Box>
                                </Grid>
                              );
                            })}
                        </Grid>
                      </Box>
                    )}

                    <TextField
                      fullWidth
                      required
                      size="small"
                      multiline
                      rows={2}
                      label="Agenda of Conversation"
                      placeholder="Summarize the core topics you wish to outline."
                      value={bookingTopic}
                      onChange={(e) => setBookingTopic(e.target.value)}
                    />

                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      size="medium"
                      disabled={submittingBooking}
                      startIcon={<BookOnlineIcon />}
                      sx={{ py: 1, mt: 1 }}
                    >
                      {submittingBooking ? <CircularProgress size={20} color="inherit" /> : 'Schedule Appointment'}
                    </Button>
                  </Box>
                </form>
              </Paper>
            </Grid>

            {/* Right Column: Booked Appointments List Status Tracker */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#064e3b', fontFamily: "'Outfit', sans-serif" }}>
                    📅 My Bookings & Statuses
                  </Typography>
                  <Button size="small" startIcon={<RefreshIcon />} onClick={fetchHistory} variant="outlined">Refresh</Button>
                </Box>

                {loadingHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, flexGrow: 1, alignItems: 'center' }}><CircularProgress /></Box>
                ) : (
                  <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', pr: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {myAppointments.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        No booked appointments.
                      </Paper>
                    ) : (
                      myAppointments.map((appt) => (
                        <Paper key={appt.id} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                📅 {appt.slot_details.date}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Time: {appt.slot_details.start_time.slice(0, 5)} - {appt.slot_details.end_time.slice(0, 5)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={appt.status} 
                              color={appt.status === 'BOOKED' ? 'primary' : appt.status === 'CANCELLED' ? 'error' : 'secondary'} 
                              size="small" 
                            />
                          </Box>
                          
                          <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                            <strong>Topic:</strong> {appt.topic}
                          </Typography>
                          
                          {appt.notes && (
                            <Box sx={{ p: 1, borderRadius: 1, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', mb: 1.5 }}>
                              <Typography variant="caption" color="error.main" display="block">
                                <strong>Office Note:</strong> {appt.notes}
                              </Typography>
                            </Box>
                          )}

                          {appt.status === 'BOOKED' && (
                            <Button 
                              fullWidth 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleCancelBooking(appt.id)}
                              sx={{ mt: 0.5, py: 0.25, fontSize: '0.75rem' }}
                            >
                              Cancel Booking
                            </Button>
                          )}
                        </Paper>
                      ))
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

      </Container>

      {/* Success Grievance dialogue */}
      <Dialog open={!!grievanceSuccess} onClose={() => setGrievanceSuccess(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#f0fdf4', color: 'success.main', fontWeight: 'bold' }}>
          ✓ Grievance Filed Successfully
        </DialogTitle>
        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your grievance has been registered. You can track its workflow updates on the right side of the grievance page.
          </Typography>
          <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f9fafb', mb: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="body2" gutterBottom><strong>Reference ID:</strong> #{grievanceSuccess?.id}</Typography>
            <Typography variant="body2" gutterBottom><strong>AI Summary:</strong> {grievanceSuccess?.summary}</Typography>
            <Typography variant="body2" gutterBottom><strong>Urgency Rating:</strong> {grievanceSuccess?.urgency}</Typography>
            <Typography variant="body2" gutterBottom><strong>Place Classified:</strong> {grievanceSuccess?.constituency}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGrievanceSuccess(null)} variant="contained" color="success">
            Ok
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Details Modal */}
      <RequestDetailModal
        open={detailOpen}
        requestId={selectedRequestId}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRequestId(null);
        }}
        staffList={[]}
        onUpdateSuccess={fetchHistory}
        userRole={currentUser.role}
      />

    </Box>
  );
}
