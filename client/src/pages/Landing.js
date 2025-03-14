import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  useTheme,
  alpha,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

/**
 * Landing - A simple, minimal landing page
 * with just essential information and login/register buttons
 */
const Landing = () => {
  const theme = useTheme();
  
  // Add effect to remove body margins
  useEffect(() => {
    // Save the original styles
    const originalStyle = {
      margin: document.body.style.margin,
      padding: document.body.style.padding,
      overflow: document.body.style.overflow
    };
    
    // Set full page styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.margin = originalStyle.margin;
      document.body.style.padding = originalStyle.padding;
      document.body.style.overflow = originalStyle.overflow;
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.secondary.dark, 0.9)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Network background overlay */}
      <Box
        component="img"
        src="/images/network/network-white.svg"
        alt="Network Background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.15,
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      
      <Container maxWidth="sm" sx={{ margin: 0, padding: 0 }}>
        <Box 
          sx={{ 
            textAlign: 'center',
            py: 8,
            px: 5,
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            justifyContent="center"
            sx={{ mb: 2 }}
          >
            <Box
              component="img"
              src="/images/thinkflow-logo.svg"
              alt="ThinkFlow Logo"
              sx={{ 
                height: 60,
                width: 60,
                filter: `drop-shadow(0 2px 5px ${alpha(theme.palette.primary.main, 0.3)})`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderRadius: '50%',
                p: 1,
              }}
            />
            
            <Box sx={{ position: 'relative' }}>
              <Typography 
                variant="h2" 
                component="h1"
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ThinkFlow
              </Typography>
              <Chip 
                label="BETA" 
                color="secondary" 
                size="small"
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: -55,
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          </Stack>
          
          <Typography 
            variant="h5" 
            color="text.secondary"
            gutterBottom
            sx={{ mb: 5, fontWeight: 400 }}
          >
            Make better decisions with a structured approach
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            paragraph
            sx={{ mb: 6 }}
          >
            ThinkFlow helps you evaluate options, collaborate with your team, and
            visualize complex choices through a powerful decision matrix platform.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mt: 4, gap: 2, justifyContent: 'center' }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              sx={{ 
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
              }}
            >
              Get Started
            </Button>
            
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="primary"
              sx={{ 
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
              }}
            >
              Sign In
            </Button>
            
            <Button
              component={RouterLink}
              to="/public/decisions/2d7b9c64-8215-4427-94da-426f7b492a62"
              variant="outlined"
              color="primary"
              sx={{ 
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
              }}
            >
              Demo
            </Button>
          </Box>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Tooltip title="Contact us: dmitry.kalinchenko@gmail.com">
              <IconButton 
                color="primary"
                component="a"
                href="mailto:dmitry.kalinchenko@gmail.com"
                sx={{ 
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <EmailIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Instagram: @rockymountainrussian">
              <IconButton 
                color="primary"
                component="a"
                href="https://www.instagram.com/rockymountainrussian/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <InstagramIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="LinkedIn: Dmitry Kalinchenko">
              <IconButton 
                color="primary"
                component="a"
                href="https://www.linkedin.com/in/dkalinchenko/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing; 