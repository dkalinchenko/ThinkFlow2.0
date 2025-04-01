import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header />
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[100],
          textAlign: 'center',
        }}
      >
        ThinkFlow © {new Date().getFullYear()}
      </Box>
    </Box>
  );
};

export default Layout; 