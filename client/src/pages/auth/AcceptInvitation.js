import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { getCurrentUser } from '../../features/auth/authSlice';

// Use environment variable or default to localhost
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  useEffect(() => {
    // Check the invitation token
    const verifyInvitation = async () => {
      try {
        const response = await axios.get(`${API_URL}/invitations/${token}`);
        setInvitation(response.data);
        setAcceptSuccess(true);
        
        console.log('Invitation accepted:', response.data);
        
        // If user is authenticated, log the user info for debugging
        if (isAuthenticated && user) {
          console.log('Current user:', user);
          console.log('Current user email:', user.email);
          console.log('Invitation email:', response.data.invitation?.email);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setError(error.response?.data?.message || 'Invalid invitation link');
        setLoading(false);
      }
    };

    if (token) {
      verifyInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token, isAuthenticated, user]);

  useEffect(() => {
    // If user is not authenticated, dispatch action to get current user
    if (!isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogin = () => {
    // Navigate to login with a redirect back to this page
    navigate(`/login?redirect=/invite/${token}`);
  };

  const handleRegister = () => {
    // Navigate to register with a redirect back to this page
    navigate(`/register?redirect=/invite/${token}`);
  };

  const handleViewDecision = () => {
    if (invitation && invitation.decision) {
      navigate(`/decisions/${invitation.decision.id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Decision Collaboration Invitation
          </Typography>
        </Box>

        {error ? (
          <Alert 
            severity="error" 
            icon={<ErrorIcon fontSize="inherit" />}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        ) : acceptSuccess ? (
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mb: 3 }}
          >
            You've been successfully added as a collaborator to this decision!
          </Alert>
        ) : null}

        {invitation && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                You've been invited to collaborate on:
              </Typography>
              <Typography variant="h5" color="primary">
                {invitation.decision.title}
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleViewDecision}
                disabled={!isAuthenticated}
              >
                View Decision
              </Button>
            </CardActions>
          </Card>
        )}

        {!isAuthenticated ? (
          <>
            <Box sx={{ my: 3 }}>
              <Typography variant="body1" paragraph>
                To access this decision, you need to log in or create an account.
              </Typography>
              <Divider sx={{ my: 2 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleLogin}
              >
                Log In
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleRegister}
              >
                Create Account
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              component={RouterLink} 
              to="/dashboard"
            >
              Go to Dashboard
            </Button>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          {isAuthenticated && user && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Debug Info:</strong> You are logged in as {user.name} ({user.email})
              </Typography>
              {invitation && invitation.decision && (
                <Typography variant="body2">
                  Decision ID: {invitation.decision.id}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AcceptInvitation; 