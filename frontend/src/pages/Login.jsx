import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

import PublicHeader from '../components/PublicHeader';
import apiService from '../services/api';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0); // 0 for Sign In, 1 for Register
  const [loginRole, setLoginRole] = useState('CITIZEN'); // 'CITIZEN', 'STAFF', 'MLA'
  
  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if redirect specified registration
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab(1);
    }

    const user = apiService.getCurrentUser();
    if (user) {
      redirectUser(user.role);
    }
  }, [searchParams]);

  const redirectUser = (role) => {
    if (role === 'MLA') {
      navigate('/mla/dashboard');
    } else if (role === 'STAFF') {
      navigate('/staff/dashboard');
    } else {
      navigate('/citizen/dashboard');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiService.login(username, password);
      if (data && data.user) {
        // Enforce role matching for security
        if (data.user.role !== loginRole) {
          apiService.logout(); // Clear token immediately
          setErrorMsg(`Security Access Denied: This credentials are not registered for ${loginRole} Access.`);
          return;
        }
        redirectUser(data.user.role);
      } else {
        setErrorMsg('Authentication failed. No user details returned.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Invalid username or password. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regFirstName || !regLastName) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMsg('Please provide at least one contact method: either an Email Address or a Phone Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiService.registerCitizen({
        username: regUsername,
        password: regPassword,
        email: regEmail,
        first_name: regFirstName,
        last_name: regLastName,
        phone: regPhone
      });
      
      setSuccessMsg('Account registered successfully! Please sign in.');
      setActiveTab(0);
      setLoginRole('CITIZEN'); // Switch to citizen tab
      setUsername(regUsername);
      setPassword('');
      
      // Reset registration form
      setRegUsername('');
      setRegPassword('');
      setRegEmail('');
      setRegFirstName('');
      setRegLastName('');
      setRegPhone('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const msg = Object.keys(errors).map(k => `${k}: ${errors[k]}`).join(', ');
        setErrorMsg(msg || 'Registration failed.');
      } else {
        setErrorMsg('Failed to register. Username might already exist.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fdfdfb' }}>
      
      {/* Public Header */}
      <PublicHeader />

      <Box sx={{ 
        minHeight: 'calc(100vh - 72px)', 
        background: 'radial-gradient(circle at 50% 50%, #f4f6f0 0%, #e2e5dc 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}>
        <Container maxWidth="xs">
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              fontFamily: "'Outfit', sans-serif",
              color: '#064e3b',
              mb: 0.5
            }}>
              Office Secure Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access the grievance filing panel or MLA/Staff workspace.
            </Typography>
          </Box>

          <Paper sx={{ 
            p: 3.5, 
            borderRadius: 3, 
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, val) => {
                setActiveTab(val);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              variant="fullWidth"
              sx={{ mb: 3, borderBottom: '1px solid #e5e7eb' }}
            >
              <Tab label="🔐 Sign In" />
              <Tab label="✍️ Register" />
            </Tabs>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                {successMsg}
              </Alert>
            )}

            {activeTab === 0 ? (
              /* Sign In Form */
              <form onSubmit={handleLoginSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  
                  {/* Select Role Checkboxes/Radio */}
                  <Box sx={{ mb: 1, p: 1.5, borderRadius: 2, border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                    <FormLabel id="login-role-label" sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#064e3b', display: 'block', mb: 0.5 }}>
                      Select Access Level
                    </FormLabel>
                    <RadioGroup
                      row
                      aria-labelledby="login-role-label"
                      name="login-role"
                      value={loginRole}
                      onChange={(e) => {
                        setLoginRole(e.target.value);
                        setErrorMsg('');
                      }}
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <FormControlLabel value="CITIZEN" control={<Radio size="small" />} label={<Typography variant="body2">Citizen</Typography>} />
                      <FormControlLabel value="STAFF" control={<Radio size="small" />} label={<Typography variant="body2">Staff</Typography>} />
                      <FormControlLabel value="MLA" control={<Radio size="small" />} label={<Typography variant="body2">MLA</Typography>} />
                    </RadioGroup>
                  </Box>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#064e3b', textAlign: 'center', mb: 0.5 }}>
                    {loginRole === 'CITIZEN' ? '🔑 Citizen Access Form' : loginRole === 'STAFF' ? '💼 Staff Portal Form' : '🏢 MLA Executive Access Form'}
                  </Typography>

                  <TextField
                    fullWidth
                    label="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircleIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1, py: 1.2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>
                </Box>
              </form>
            ) : (
              /* Citizen Registration Form */
              <form onSubmit={handleRegisterSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                  <TextField
                    fullWidth
                    label="Select Username"
                    required
                    placeholder="e.g. vaishnav_byju"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Select Password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      required
                      fullWidth
                      label="First Name"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                    />
                    <TextField
                      required
                      fullWidth
                      label="Last Name"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    placeholder="e.g. yourname@mail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="e.g. 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1, py: 1.2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Account'}
                  </Button>
                </Box>
              </form>
            )}
          </Paper>
        </Container>
      </Box>

    </Box>
  );
}
