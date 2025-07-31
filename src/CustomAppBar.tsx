import React from 'react';
import { useLocation, Link } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { SensorsRounded } from '@mui/icons-material';

export const CustomAppBar: React.FC = () => {
  const location = useLocation();

  const getTitle = (): string => {
    switch (location.pathname) {
      case '/':
        return 'Trang chủ';
      case '/history':
        return 'Hóa đơn';
      case '/devices':
        return 'Thiết bị';
      case '/raw':
        return 'Raw Data';
      case '/realtime':
        return 'Hiển thị';
      case  '/ota':
        return "Cập nhật firmware"
      default:
        return '';
    }
  };

  return (
    <AppBar position="fixed" className="mb-20">
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <SensorsRounded />
          </IconButton>

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Trang chủ
          </Typography>
{/* 
          <Typography
            variant="h6"
            component={Link}
            to="/ota"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Cập nhật firmware
          </Typography> */}

          <Typography variant="h5" className="px-4">
            {getTitle()}
          </Typography>
        </Toolbar>
      </Box>
    </AppBar>
  );
};
