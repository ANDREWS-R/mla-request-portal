import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Paper,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TranslateIcon from '@mui/icons-material/Translate';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';

import apiService from '../services/api';

const URGENCY_CHIPS = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' }
};

const STATUS_CHIPS = {
  PENDING: { label: 'Pending', color: 'warning' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  RESOLVED: { label: 'Resolved', color: 'success' },
  ESCALATED: { label: 'Escalated', color: 'error' }
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

export default function RequestDetailModal({ open, requestId, onClose, staffList, onUpdateSuccess, userRole }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  // Modifiable fields
  const [status, setStatus] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [isSpam, setIsSpam] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState('');

  // Comment fields
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently remove this grievance request?")) {
      setDeleting(true);
      try {
        await apiService.deleteRequest(requestId);
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
        onClose();
      } catch (err) {
        console.error("Error deleting request:", err);
        alert("Failed to delete request.");
      } finally {
        setDeleting(false);
      }
    }
  };

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails();
    }
  }, [open, requestId]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRequestDetail(requestId);
      setRequest(data);
      setStatus(data.status);
      setAssignedStaff(data.assigned_staff || '');
      setIsSpam(data.is_spam);
      setIsDuplicate(data.is_duplicate);
      setDuplicateOf(data.duplicate_of || '');
    } catch (err) {
      console.error('Failed to load request details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusOrStaff = async () => {
    setUpdatingRequest(true);
    try {
      const updates = { 
        status,
        is_spam: isSpam,
        is_duplicate: isDuplicate,
        duplicate_of: isDuplicate ? (duplicateOf || null) : null
      };
      if (userRole === 'MLA') {
        updates.assigned_staff = assignedStaff || null;
      }
      await apiService.updateRequest(requestId, updates);
      onUpdateSuccess();
      fetchRequestDetails();
      alert('Request details updated successfully.');
    } catch (err) {
      console.error('Failed to update request:', err);
      alert('Failed to update request settings.');
    } finally {
      setUpdatingRequest(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await apiService.addComment(requestId, commentText);
      setCommentText('');
      fetchRequestDetails();
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getAudioUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const host = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;
    return `${host}${filePath}`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: '#ffffff',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '3px solid #d97706',
        p: 2.5
      }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#ffffff' }}>
            Request #{requestId}: {request?.subject || 'Loading...'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {request && (
              <>
                <Chip 
                  label={STATUS_CHIPS[request.status]?.label} 
                  color={STATUS_CHIPS[request.status]?.color} 
                  size="small" 
                />
                <Chip 
                  label={`Urgency: ${URGENCY_CHIPS[request.urgency]?.label}`} 
                  color={URGENCY_CHIPS[request.urgency]?.color} 
                  size="small" 
                  variant="outlined" 
                  sx={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                />
                <Chip 
                  label={request.category === 'OTHER' && request.custom_category ? request.custom_category : (CATEGORIES[request.category] || request.category)} 
                  color="primary" 
                  size="small" 
                  variant="outlined" 
                  sx={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                />
                <Chip 
                  label={`Place: ${request.constituency}`} 
                  color="secondary" 
                  size="small" 
                  variant="outlined" 
                  sx={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                />
                {request.is_spam && <Chip label="Flagged Spam" color="error" size="small" />}
                {request.is_duplicate && <Chip label={`Duplicate of #${request.duplicate_of}`} color="warning" size="small" />}
              </>
            )}
          </Box>
        </Box>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>Close</Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {loading || !request ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Left side: Information and Description */}
            <Grid item xs={12} md={7}>
              {/* AI Summary Block */}
              <Paper sx={{ p: 2.5, mb: 3, backgroundColor: 'rgba(30, 58, 138, 0.04)', border: '1px solid rgba(30, 58, 138, 0.12)' }}>
                <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 'bold' }}>
                  <SubscriptionsIcon fontSize="small" /> AI Summarization & Analysis
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#1e293b', lineHeight: 1.6 }}>
                  "{request.summary || 'Summary processing...'}"
                </Typography>
              </Paper>

              {/* Submitter Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1e3a8a' }}>
                  <PersonIcon fontSize="small" /> Submitter Information
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <strong>Name:</strong> {request.submitter_name || 'Anonymous citizen'}
                </Typography>
                {request.submitter_phone && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> {request.submitter_phone}
                  </Typography>
                )}
                {request.submitter_email && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> {request.submitter_email}
                  </Typography>
                )}
              </Box>

              {/* Audio Player if present */}
              {request.voice_file && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    🔊 Submitted Voice Recording:
                  </Typography>
                  <audio controls src={getAudioUrl(request.voice_file)} style={{ width: '100%', marginTop: 8 }} />
                </Box>
              )}

              {/* Text Description & Translation Toggle */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Description Content
                  </Typography>
                  {request.source_language !== 'en' && (
                    <Button 
                      startIcon={<TranslateIcon />} 
                      size="small" 
                      onClick={() => setShowOriginal(!showOriginal)}
                      variant="outlined"
                      color="secondary"
                    >
                      {showOriginal ? 'Show English Translation' : 'Show Original Language'}
                    </Button>
                  )}
                </Box>
                <Paper sx={{ p: 2.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', maxHeight: 250, overflowY: 'auto' }}>
                  {showOriginal ? (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {request.description}
                    </Typography>
                  ) : (
                    <Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {request.translation || request.description}
                      </Typography>
                      {request.source_language !== 'en' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          * Automatically translated from {request.source_language.toUpperCase()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>

              {request.attachment_file && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📂 Attachment:
                  </Typography>
                  <Button 
                    href={getAudioUrl(request.attachment_file)} 
                    target="_blank" 
                    variant="contained" 
                    color="secondary"
                    size="small"
                  >
                    View Attachment Document
                  </Button>
                </Box>
              )}
            </Grid>

            {/* Right side: Management and Comments */}
            <Grid item xs={12} md={5}>
              {/* Management Controls */}
              <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2, color: '#1e3a8a' }}>
                  Grievance Administration
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="ESCALATED">Escalated</MenuItem>
                  </Select>
                </FormControl>

                {userRole === 'MLA' && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="staff-select-label">Assigned Staff</InputLabel>
                    <Select
                      labelId="staff-select-label"
                      value={assignedStaff}
                      label="Assigned Staff"
                      onChange={(e) => setAssignedStaff(e.target.value)}
                    >
                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                      {staffList?.map((staff) => (
                        <MenuItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name} ({staff.username})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Spam and Duplicate Manual Audits (only for MLA/Staff) */}
                {userRole !== 'CITIZEN' && (
                  <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isSpam}
                          onChange={(e) => setIsSpam(e.target.checked)}
                          color="error"
                        />
                      }
                      label="Flag as Spam/Gibberish"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isDuplicate}
                          onChange={(e) => setIsDuplicate(e.target.checked)}
                          color="warning"
                        />
                      }
                      label="Flag as Duplicate Complaint"
                    />
                    {isDuplicate && (
                      <TextField
                        size="small"
                        fullWidth
                        label="Original Request ID"
                        placeholder="e.g. 3"
                        value={duplicateOf}
                        onChange={(e) => setDuplicateOf(e.target.value)}
                      />
                    )}
                  </Box>
                )}

                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={handleUpdateStatusOrStaff}
                  disabled={updatingRequest}
                >
                  {updatingRequest ? <CircularProgress size={24} /> : 'Save Updates'}
                </Button>
              </Paper>

              {/* Comments Feed */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                  Timeline Notes & Comments
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {request.comments?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No notes logged on this timeline.
                    </Typography>
                  ) : (
                    request.comments?.map((comment) => (
                      <Paper key={comment.id} sx={{ p: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="bold" color="primary">
                            {comment.user_name} ({comment.user_role})
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 10 }} />
                            {new Date(comment.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{comment.text}</Typography>
                      </Paper>
                    ))
                  )}
                </Box>

                <form onSubmit={handleAddComment}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Log update or timeline progress note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button 
                    type="submit" 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? <CircularProgress size={20} /> : 'Add Timeline Note'}
                  </Button>
                </form>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<DeleteIcon />} 
          onClick={handleDelete}
          disabled={deleting}
          sx={{ fontWeight: 'bold' }}
        >
          {deleting ? 'Removing...' : 'Remove Request'}
        </Button>
        <Button onClick={onClose} variant="outlined" color="inherit">Close Grievance File</Button>
      </DialogActions>
    </Dialog>
  );
}
