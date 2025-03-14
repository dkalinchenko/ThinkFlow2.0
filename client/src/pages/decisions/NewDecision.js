import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Public as PublicIcon } from '@mui/icons-material';
import { createDecision, clearError } from '../../features/decisions/decisionsSlice';

const NewDecision = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.decisions);
  
  const [decision, setDecision] = useState({
    title: '',
    description: '',
    isPublic: false,
  });
  
  const [criteria, setCriteria] = useState([
    { name: 'Cost', weight: 1 },
    { name: 'Quality', weight: 1 },
  ]);
  
  const [alternatives, setAlternatives] = useState([
    { name: 'Option A', description: '' },
    { name: 'Option B', description: '' },
  ]);
  
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);

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
    setCriteria([...criteria, { name: '', weight: 1 }]);
  };

  const removeCriterion = (index) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria);
  };

  const addAlternative = () => {
    setAlternatives([...alternatives, { name: '', description: '' }]);
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
    
    const newDecision = {
      title: decision.title,
      description: decision.description,
      isPublic: decision.isPublic,
      criteria: criteria.map(({ name, weight }) => ({ name, weight })),
      alternatives: alternatives.map(({ name, description }) => ({ name, description: description || '' })),
    };
    
    dispatch(createDecision(newDecision))
      .unwrap()
      .then(response => {
        navigate(`/decisions/${response.data.id}`);
      })
      .catch(error => {
        console.error('Failed to create decision:', error);
      });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Decision
      </Typography>
      <Typography variant="body1" paragraph>
        Fill in the details below to create a new decision matrix.
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              Add Criterion
            </Button>
          </Box>
          
          {validationErrors.criteria && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.criteria}
            </Alert>
          )}
          
          <List>
            {criteria.map((criterion, index) => (
              <ListItem 
                key={index} 
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
                      disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
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
                    disabled={criteria.length <= 1 || loading}
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
              disabled={loading}
            >
              Add Alternative
            </Button>
          </Box>
          
          {validationErrors.alternatives && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.alternatives}
            </Alert>
          )}
          
          <List>
            {alternatives.map((alternative, index) => (
              <ListItem 
                key={index} 
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
                    disabled={loading}
                  />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeAlternative(index)}
                    disabled={alternatives.length <= 1 || loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Description (optional)"
                  value={alternative.description}
                  onChange={(e) => handleAlternativeChange(index, 'description', e.target.value)}
                  disabled={loading}
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
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Decision'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NewDecision; 