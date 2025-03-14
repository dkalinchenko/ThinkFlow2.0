import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Person as PersonIcon, 
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';
const CLIENT_URL = 'http://localhost:3000';

const InviteCollaboratorModal = ({ open, onClose, decisionId, decisionTitle, invitations = [], onInvitationSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error and success when user types
    setError(null);
    setSuccess(false);
  };

  const validateEmail = (email) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  };

  const handleInvite = async () => {
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email is already invited
    if (invitations.some(invite => invite.email.toLowerCase() === email.toLowerCase())) {
      setError('This email has already been invited');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/decisions/${decisionId}/invitations`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      setEmail('');
      if (onInvitationSent) {
        onInvitationSent(response.data.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send invitation';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when modal is closed
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInvitationLink = (accessToken) => {
    return `${CLIENT_URL}/invite/${accessToken}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="invite-collaborator-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="invite-collaborator-dialog-title">
        Invite Collaborators
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Invite others to collaborate on "{decisionTitle}". Enter their email and we'll generate a unique invitation link that you can share with them.
        </DialogContentText>

        <Box sx={{ mt: 3, mb: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={handleEmailChange}
            error={Boolean(error)}
            helperText={error}
            placeholder="Enter email address"
            InputProps={{
              startAdornment: (
                <EmailIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
            disabled={loading}
          />
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Invitation link generated successfully!
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleInvite}
          disabled={loading || !email}
          sx={{ mb: 3 }}
        >
          {loading ? 'Generating...' : 'Generate Invitation Link'}
        </Button>

        {invitations.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Invitation Links
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share these links with your collaborators. Each link is unique and can only be used once.
            </Typography>
            <List>
              {invitations.map((invitation) => (
                <ListItem
                  key={invitation.id}
                  sx={{
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={invitation.email}
                      secondary={`Invited on ${formatDate(invitation.created_at)}`}
                    />
                    <Chip
                      label={invitation.status}
                      color={getStatusColor(invitation.status)}
                      size="small"
                    />
                  </Box>
                  
                  {invitation.accessToken && invitation.status === 'pending' && (
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      value={getInvitationLink(invitation.accessToken)}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Copy link">
                              <IconButton 
                                edge="end"
                                onClick={() => copyToClipboard(getInvitationLink(invitation.accessToken))}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mx: 2, mb: 1 }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Tip: Copy these links and share them with your collaborators via your preferred communication method.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        message="Link copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Dialog>
  );
};

export default InviteCollaboratorModal; 