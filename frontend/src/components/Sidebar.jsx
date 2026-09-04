import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const drawerWidth = 240;

export default function Sidebar({ currentTab, onTabChange, userRole }) {
  const menuItems = [
    { id: 'dashboard', label: 'Analytics Dashboard', icon: <DashboardIcon /> },
    { id: 'requests', label: 'Grievance Queue', icon: <ListAltIcon /> },
  ];

  if (userRole === 'MLA' || userRole === 'STAFF') {
    menuItems.push({ id: 'appointments', label: 'Manage Appointments', icon: <CalendarMonthIcon /> });
  }

  if (userRole === 'MLA') {
    menuItems.push({ id: 'staff', label: 'Staff Management', icon: <PeopleIcon /> });
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          backgroundColor: '#f1f5f9', // Clean light gray
          borderRight: '1px solid #e2e8f0'
        },
      }}
    >
      <Toolbar /> {/* Spaces sidebar content below the fixed appbar */}
      <Box sx={{ overflow: 'auto', p: 2 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentTab === item.id}
                onClick={() => onTabChange(item.id)}
                sx={{
                  borderRadius: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(30, 58, 138, 0.08)',
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(30, 58, 138, 0.12)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: currentTab === item.id ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: currentTab === item.id ? 'bold' : 'medium'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.01)', border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight="bold">
            CONSTITUENCY
          </Typography>
          <ListItemButton
            href="/"
            target="_blank"
            sx={{
              borderRadius: 1.5,
              p: 1,
              '&:hover': {
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                color: 'secondary.main'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 30, color: 'secondary.main' }}>
              <LaunchIcon sx={{ fontSize: 14 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Public Homepage" 
              primaryTypographyProps={{ fontSize: '0.8rem' }} 
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
}
