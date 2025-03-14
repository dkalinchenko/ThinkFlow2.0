import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { Person as PersonIcon, Star as StarIcon, Check as CheckIcon } from '@mui/icons-material';

const CollaboratorsList = ({ decision, currentUserId }) => {
  if (!decision) return null;

  // Combine creator and collaborators from accepted invitations
  const collaborators = [];
  
  // Add the creator
  collaborators.push({
    id: decision.creator.id,
    name: decision.creator.name,
    email: decision.creator.email,
    isCreator: true,
    status: 'active',
    canScore: true,
  });

  // Add collaborators from accepted invitations
  const acceptedInvitations = decision.invitations.filter(
    (invitation) => invitation.status === 'accepted'
  );

  acceptedInvitations.forEach((invitation) => {
    // In a real app, we would have full user information
    // Here we just have the email from the invitation
    collaborators.push({
      id: invitation.id,
      name: invitation.email.split('@')[0], // Use first part of email as name
      email: invitation.email,
      isCreator: false,
      status: 'active',
      canScore: true,
    });
  });

  // Add pending collaborators
  const pendingInvitations = decision.invitations.filter(
    (invitation) => invitation.status === 'pending'
  );

  pendingInvitations.forEach((invitation) => {
    collaborators.push({
      id: invitation.id,
      name: invitation.email.split('@')[0], // Use first part of email as name
      email: invitation.email,
      isCreator: false,
      status: 'pending',
      canScore: false,
    });
  });

  // Get the scores for each user
  const scoresByUser = {};
  decision.scores.forEach((score) => {
    if (!scoresByUser[score.user_id]) {
      scoresByUser[score.user_id] = 0;
    }
    scoresByUser[score.user_id]++;
  });

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Collaborators
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Both the creator and accepted collaborators can score alternatives. Pending invitations need to be accepted before collaborators can contribute.
      </Alert>

      <Divider sx={{ mb: 2 }} />
      <List sx={{ py: 0 }}>
        {collaborators.map((collaborator) => (
          <ListItem
            key={collaborator.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: collaborator.isCreator ? 'primary.main' : 'secondary.main' }}>
                {collaborator.isCreator ? <StarIcon /> : <PersonIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {collaborator.name}
                  {collaborator.isCreator && (
                    <Chip
                      label="Creator"
                      color="primary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {collaborator.id === currentUserId && (
                    <Chip
                      label="You"
                      color="secondary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {collaborator.canScore && (
                    <Chip
                      label="Can Score"
                      color="success"
                      size="small"
                      icon={<CheckIcon />}
                      sx={{ ml: 1 }}
                    />
                  )}
                  {collaborator.status === 'pending' && (
                    <Chip
                      label="Pending"
                      color="warning"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {collaborator.email}
                  </Typography>
                  {scoresByUser[collaborator.id] > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Provided {scoresByUser[collaborator.id]} scores
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
        {collaborators.length === 1 && (
          <ListItem>
            <ListItemText
              secondary="No collaborators yet. Invite others to collaborate on this decision."
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default CollaboratorsList; 