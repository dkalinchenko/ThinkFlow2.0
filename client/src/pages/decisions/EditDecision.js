import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  InputAdornment,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, ArrowBack as ArrowBackIcon, Public as PublicIcon } from '@mui/icons-material';
import { fetchDecision, updateDecision, clearError } from '../../features/decisions/decisionsSlice';

const EditDecision = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentDecision, loading, error } = useSelector((state) => state.decisions);
  const { user } = useSelector((state) => state.auth);
  
  const [decision, setDecision] = useState({
    title: '',
    description: '',
    isPublic: false,
  });
  
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchDecision(id));
  }, [dispatch, id]);
  
  useEffect(() => {
    if (currentDecision && !initialized) {
      // Initialize form with current decision data
      setDecision({
        title: currentDecision.title,
        description: currentDecision.description || '',
        isPublic: currentDecision.isPublic || false,
      });
      
      setCriteria(currentDecision.criteria.map(c => ({ ...c })));
      setAlternatives(currentDecision.alternatives.map(a => ({ ...a })));
      setInitialized(true);
    }
  }, [currentDecision, initialized]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!decision.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (criteria.length === 0) {
      errors.criteria = 'At least one criterion is required';
    } else {
      const hasEmptyCriterion = criteria.some(criterion => !criterion.name.trim());
      if (hasEmptyCriterion) {
        errors.criteria = 'All criteria must have names';
      }
    }
    
    if (alternatives.length === 0) {
      errors.alternatives = 'At least one alternative is required';
    } else {
      const hasEmptyAlternative = alternatives.some(alt => !alt.name.trim());
      if (hasEmptyAlternative) {
        errors.alternatives = 'All alternatives must have names';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDecisionChange = (e) => {
    const { name, value } = e.target;
    setDecision({ ...decision, [name]: value });
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handlePrivacyToggle = () => {
    setDecision({ ...decision, isPublic: !decision.isPublic });
  };

  const handleCriterionChange = (index, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[index][field] = value;
    setCriteria(newCriteria);
    
    // Clear validation error when user changes criteria
    if (validationErrors.criteria) {
      setValidationErrors({ ...validationErrors, criteria: '' });
    }
  };

  const handleAlternativeChange = (index, field, value) => {
    const newAlternatives = [...alternatives];
    newAlternatives[index][field] = value;
    setAlternatives(newAlternatives);
    
    // Clear validation error when user changes alternatives
    if (validationErrors.alternatives) {
      setValidationErrors({ ...validationErrors, alternatives: '' });
    }
  };

  const addCriterion = () => {
    setCriteria([...criteria, { id: `new-criterion-${Date.now()}`, name: '', weight: 1 }]);
  };

  const removeCriterion = (index) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria);
  };

  const addAlternative = () => {
    setAlternatives([...alternatives, { id: `new-alternative-${Date.now()}`, name: '', description: '' }]);
  };

  const removeAlternative = (index) => {
    const newAlternatives = [...alternatives];
    newAlternatives.splice(index, 1);
    setAlternatives(newAlternatives);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaveLoading(true);
    
    const updatedDecision = {
      ...currentDecision,
      title: decision.title,
      description: decision.description,
      isPublic: decision.isPublic,
      criteria: criteria.map(({ id, name, weight }) => ({ id, name, weight })),
      alternatives: alternatives.map(({ id, name, description }) => ({ id, name, description: description || '' })),
      updated_at: new Date().toISOString(),
    };
    
    dispatch(updateDecision({ id, decisionData: updatedDecision }))
      .unwrap()
      .then(() => {
        navigate(`/decisions/${id}`);
      })
      .catch(error => {
        console.error('Failed to update decision:', error);
        setSaveLoading(false);
      });
  };
  
  if (loading && !initialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!currentDecision && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        Decision not found.
      </Alert>
    );
  }
  
  // Check if user is the creator of the decision
  if (currentDecision && currentDecision.creator.id !== user?.id) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        You do not have permission to edit this decision.
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        component={RouterLink}
        to={`/decisions/${id}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Decision
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Decision
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Decision Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Title"
              name="title"
              value={decision.title}
              onChange={handleDecisionChange}
              error={Boolean(validationErrors.title)}
              helperText={validationErrors.title}
              disabled={saveLoading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={decision.description}
              onChange={handleDecisionChange}
              disabled={saveLoading}
            />
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="If enabled, anyone with the link can view this decision (but not edit it)">
              <FormControlLabel
                control={
                  <Switch
                    checked={decision.isPublic}
                    onChange={handlePrivacyToggle}
                    name="isPublic"
                    color="primary"
                    disabled={saveLoading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PublicIcon sx={{ mr: 1 }} />
                    <Typography>Make decision public</Typography>
                  </Box>
                }
              />
            </Tooltip>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Criteria</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addCriterion}
              variant="outlined"
              size="small"
              disabled={saveLoading}
            >
              Add Criterion
            </Button>
          </Box>
          
          {validationErrors.criteria && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.criteria}
            </Alert>
          )}
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            Editing criteria may affect existing scores. Consider creating a new decision if significant changes are needed.
          </Alert>
          
          <List>
            {criteria.map((criterion, index) => (
              <ListItem 
                key={criterion.id} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  mb: 1, 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <TextField
                      fullWidth
                      size="small"
                      label="Criterion Name"
                      value={criterion.name}
                      onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                      disabled={saveLoading}
                    />
                  }
                  secondary={
                    <Box sx={{ mt: 2 }}>
                      <Typography id={`weight-slider-${index}`} gutterBottom>
                        Weight: {criterion.weight}
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                          <Slider
                            value={criterion.weight}
                            onChange={(_, newValue) => handleCriterionChange(index, 'weight', newValue)}
                            aria-labelledby={`weight-slider-${index}`}
                            step={0.1}
                            min={0.1}
                            max={5}
                            valueLabelDisplay="auto"
                            disabled={saveLoading}
                          />
                        </Grid>
                        <Grid item>
                          <TextField
                            value={criterion.weight}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0.1 && value <= 5) {
                                handleCriterionChange(index, 'weight', value);
                              }
                            }}
                            InputProps={{
                              type: 'number',
                              inputProps: {
                                min: 0.1,
                                max: 5,
                                step: 0.1,
                              },
                              startAdornment: <InputAdornment position="start">×</InputAdornment>,
                            }}
                            size="small"
                            sx={{ width: '100px' }}
                            disabled={saveLoading}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeCriterion(index)}
                    disabled={criteria.length <= 1 || saveLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Alternatives</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addAlternative}
              variant="outlined"
              size="small"
              disabled={saveLoading}
            >
              Add Alternative
            </Button>
          </Box>
          
          {validationErrors.alternatives && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.alternatives}
            </Alert>
          )}
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            Editing alternatives may affect existing scores. Consider creating a new decision if significant changes are needed.
          </Alert>
          
          <List>
            {alternatives.map((alternative, index) => (
              <ListItem 
                key={alternative.id} 
                sx={{ 
                  bgcolor: 'background.paper', 
                  mb: 1, 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'block',
                  px: 2,
                  py: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <TextField
                    size="small"
                    label="Alternative Name"
                    value={alternative.name}
                    onChange={(e) => handleAlternativeChange(index, 'name', e.target.value)}
                    sx={{ width: 'calc(100% - 48px)' }}
                    disabled={saveLoading}
                  />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeAlternative(index)}
                    disabled={alternatives.length <= 1 || saveLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Description (optional)"
                  value={alternative.description || ''}
                  onChange={(e) => handleAlternativeChange(index, 'description', e.target.value)}
                  disabled={saveLoading}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditDecision; 