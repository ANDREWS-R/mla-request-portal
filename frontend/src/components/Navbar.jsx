import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Navbar({ user, onLogout }) {
  return (
    <AppBar position="fixed" sx={{ 
      background: '#064e3b', 
      borderBottom: '3px solid #d97706',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: (theme) => theme.zIndex.drawer + 1
    }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Stylised conch seal emblem logo */}
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#d97706" stroke="#ffffff" strokeWidth="2"/>
            <path d="M50 15 C30 15 25 45 42 65 C45 68 55 68 58 65 C75 45 70 15 50 15 Z" fill="#064e3b"/>
            <circle cx="50" cy="40" r="10" fill="#ffffff"/>
            <path d="M40 70 L60 70 L55 85 L45 85 Z" fill="#ffffff"/>
            <path d="M35 50 C20 60 20 80 40 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
            <path d="M65 50 C80 60 80 80 60 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ 
              fontFamily: "'Outfit', sans-serif",
              color: '#ffffff',
              lineHeight: 1.1
            }}>
              MLA Citizen Portal
            </Typography>
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
              Aluva Constituency
            </Typography>
          </Box>
          {user && (
            <Chip 
              label={user.role === 'CITIZEN' ? 'Citizen Account' : user.role === 'MLA' ? 'MLA Office' : 'Staff Account'} 
              color="secondary" 
              size="small" 
              sx={{ color: '#ffffff', fontWeight: 'bold', ml: 1 }}
            />
          )}
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon sx={{ color: '#ffffff', opacity: 0.9 }} />
              <Box sx={{ color: '#ffffff' }}>
                <Typography variant="body2" fontWeight="bold">
                  {user.first_name} {user.last_name || user.username}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: -0.2, opacity: 0.8 }}>
                  {user.role === 'MLA' ? 'Member of Legislative Assembly (MLA)' : user.role === 'STAFF' ? 'Office Administrator' : 'Verified Citizen'}
                </Typography>
              </Box>
            </Box>
            <div id="google_translate_element" style={{ marginRight: '8px' }}></div>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="small"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }
              }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
