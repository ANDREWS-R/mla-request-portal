import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import AudioRecorder from '../components/AudioRecorder';
import apiService from '../services/api';

export default function CitizenForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [attachment, setAttachment] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAudioRecorded = (file) => {
    setAudioFile(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg('Please provide a subject for your request.');
      return;
    }
    if (!description.trim() && !audioFile) {
      setErrorMsg('Please describe your request in text OR record a voice message.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('submitter_name', name);
    formData.append('submitter_email', email);
    formData.append('submitter_phone', phone);
    formData.append('subject', subject);
    formData.append('description', description);
    
    // Default constituency is Aluva for demonstration, can be auto-extracted in backend
    formData.append('constituency', 'Aluva'); 

    if (audioFile) {
      formData.append('voice_file', audioFile);
    }
    if (attachment) {
      formData.append('attachment_file', attachment);
    }

    try {
      const response = await apiService.submitCitizenRequest(formData);
      setSuccessData(response.data);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setDescription('');
      setAudioFile(null);
      setAttachment(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to submit request. Please verify connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 50% 50%, #0d1527 0%, #070a13 100%)',
      py: 6,
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" sx={{ 
            fontFamily: "'Outfit', sans-serif",
            background: 'linear-gradient(90deg, #6366f1 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1.5
          }}>
            Submit Request to MLA Office
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Submit your grievances, infrastructure suggestions, or applications. You can write in English/Malayalam, upload supporting files, or record a voice message.
          </Typography>
        </Box>

        <Paper sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 4, 
          backgroundColor: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Contact Info */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" color="primary.light" sx={{ mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  1. Contact Information (Optional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Your Name"
                  placeholder="e.g. Suresh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="e.g. 9845012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  placeholder="e.g. suresh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>

              {/* Request Details */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.light" sx={{ mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  2. Request Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Subject / Topic"
                  placeholder="What is the issue about? (e.g. Damaged water pipe, Road potholes)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Description"
                  placeholder="Describe your issue or request in detail (English/Malayalam). If you prefer, you can record a voice message below instead."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>

              {/* Audio/Voice Recording Option */}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Voice Message Submission
                </Typography>
                <AudioRecorder onAudioRecorded={handleAudioRecorded} />
              </Grid>

              {/* File Attachment Upload */}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Supporting Documents (PDF/Image)
                </Typography>
                <Box sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'rgba(31, 41, 55, 0.3)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  justifyContent: 'center',
                  minHeight: 146
                }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    color="secondary"
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </Button>
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    {attachment ? `Selected: ${attachment.name}` : 'Upload PDF estimate, letters, or photo evidence.'}
                  </Typography>
                </Box>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={submitting ? null : <SendIcon />}
                  disabled={submitting}
                  sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
                >
                  {submitting ? <CircularProgress size={26} color="inherit" /> : 'Submit Request'}
                </Button>
              </Grid>

            </Grid>
          </form>
        </Paper>

        {/* Success Confirmation Modal */}
        <Dialog open={!!successData} onClose={() => setSuccessData(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'success.light', p: 3, fontWeight: 'bold' }}>
            ✓ Request Submitted Successfully
          </DialogTitle>
          <DialogContent sx={{ p: 3, backgroundColor: '#111827' }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              Thank you! Your request has been registered in the system. Our AI processing has initiated transcription, translation, and classification.
            </Typography>
            
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Reference ID:</strong> #{successData?.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Subject:</strong> {successData?.subject}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>AI Category:</strong> {successData?.category}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Urgency Assessment:</strong> {successData?.urgency}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {successData?.status}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              A staff officer will review your request and contact you if any details are required. Reference ID can be used for tracking.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, backgroundColor: '#111827' }}>
            <Button onClick={() => setSuccessData(null)} variant="contained" color="success">
              Done
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
