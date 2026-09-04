import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LoginIcon from '@mui/icons-material/Login';

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          
          {/* Logo Brand Section */}
          <Box 
            onClick={() => navigate('/')} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 }
            }}
          >
            {/* Direct styled SVG of conch/elephants emblem */}
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="#d97706" stroke="#ffffff" strokeWidth="2"/>
              <path d="M50 15 C30 15 25 45 42 65 C45 68 55 68 58 65 C75 45 70 15 50 15 Z" fill="#064e3b"/>
              <circle cx="50" cy="40" r="10" fill="#ffffff"/>
              <path d="M40 70 L60 70 L55 85 L45 85 Z" fill="#ffffff"/>
              <path d="M35 50 C20 60 20 80 40 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
              <path d="M65 50 C80 60 80 80 60 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <Box>
              <Typography 
                variant="subtitle2" 
                fontWeight="bold" 
                sx={{ 
                  lineHeight: 1.1, 
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}
              >
                Government of Kerala
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#f59e0b', 
                  fontWeight: 'bold',
                  display: 'block'
                }}
              >
                MLA Constituency Portal
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={() => navigate('/')}
              sx={{
                color: '#ffffff',
                borderBottom: isActive('/') ? '3px solid #f59e0b' : '3px solid transparent',
                borderRadius: 0,
                px: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              Home
            </Button>
            
            <Button
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/analytics')}
              sx={{
                color: '#ffffff',
                borderBottom: isActive('/analytics') ? '3px solid #f59e0b' : '3px solid transparent',
                borderRadius: 0,
                px: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              Detailed Analytics
            </Button>
            <div id="google_translate_element" style={{ alignSelf: 'center', marginRight: '8px' }}></div>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{
                fontWeight: 'bold',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#b45309' }
              }}
            >
              Sign In / Register
            </Button>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}
