import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { fetchDecisions, deleteDecision } from '../features/decisions/decisionsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { decisions, loading, error } = useSelector((state) => state.decisions);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDecisions());
  }, [dispatch]);

  const handleDeleteDecision = (id) => {
    if (window.confirm('Are you sure you want to delete this decision?')) {
      dispatch(deleteDecision(id));
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/decisions/new"
          startIcon={<AddIcon />}
        >
          New Decision
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {decisions.length === 0 ? (
        <Card sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              You don't have any decisions yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Start by creating your first decision matrix
            </Typography>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/decisions/new"
                startIcon={<AddIcon />}
              >
                Create First Decision
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {decisions.map((decision) => (
            <Grid item xs={12} sm={6} md={4} key={decision.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography gutterBottom variant="h6" component="div" sx={{ wordBreak: 'break-word' }}>
                      {decision.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {decision.is_sample && (
                        <Chip
                          label="Sample"
                          size="small"
                          color="secondary"
                        />
                      )}
                      <Chip
                        label={decision.status}
                        size="small"
                        color={getStatusColor(decision.status)}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px' }}>
                    {decision.description || 'No description provided'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Created by: {decision.creator.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(decision.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/decisions/${decision.id}`}
                    startIcon={<ViewListIcon />}
                  >
                    View
                  </Button>
                  {decision.creator.id === user?.id && (
                    <>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/decisions/${decision.id}/edit`}
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDecision(decision.id)}
                        startIcon={<DeleteIcon />}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 