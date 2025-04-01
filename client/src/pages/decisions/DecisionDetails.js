import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  TextField,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { fetchDecision, updateDecision, deleteDecision, submitScores } from '../../features/decisions/decisionsSlice';
import InviteCollaboratorModal from '../../components/invitations/InviteCollaboratorModal';
import CollaboratorsList from '../../components/invitations/CollaboratorsList';
import DecisionChart from '../../components/decisions/DecisionChart';
import ContributorScores from '../../components/decisions/ContributorScores';
import axios from 'axios';

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`decision-tabpanel-${index}`}
      aria-labelledby={`decision-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DecisionDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentDecision, loading, error } = useSelector((state) => state.decisions);
  const { user } = useSelector((state) => state.auth);
  
  const [tabValue, setTabValue] = useState(0);
  const [scores, setScores] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchDecision(id));
  }, [dispatch, id]);
  
  useEffect(() => {
    // Initialize scores from current decision if available
    if (currentDecision && user) {
      const initialScores = {};
      const userScores = currentDecision.scores.filter(score => score.user_id === user.id);
      
      currentDecision.alternatives.forEach(alt => {
        initialScores[alt.id] = {};
        
        currentDecision.criteria.forEach(criterion => {
          const existingScore = userScores.find(
            s => s.alternative_id === alt.id && s.criterion_id === criterion.id
          );
          initialScores[alt.id][criterion.id] = existingScore ? existingScore.value : 0;
        });
      });
      
      setScores(initialScores);
      
      // Check if scoring is complete
      const isComplete = currentDecision.alternatives.every(alt => 
        currentDecision.criteria.every(criterion => 
          initialScores[alt.id][criterion.id] > 0
        )
      );
      
      setScoringComplete(isComplete);
    }
  }, [currentDecision, user]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleScoreChange = (alternativeId, criterionId, value) => {
    setScores({
      ...scores,
      [alternativeId]: {
        ...scores[alternativeId],
        [criterionId]: value
      }
    });
    
    // Check if scoring is complete after this change
    const isComplete = currentDecision.alternatives.every(alt => 
      currentDecision.criteria.every(criterion => {
        if (alt.id === alternativeId && criterion.id === criterionId) {
          return value > 0;
        }
        return scores[alt.id][criterion.id] > 0;
      })
    );
    
    setScoringComplete(isComplete);
  };
  
  const handleSaveScores = async () => {
    if (!currentDecision) return;
    
    setSaveLoading(true);
    
    try {
      // Transform scores to array format expected by API
      const scoresToSave = [];
      
      Object.entries(scores).forEach(([alternativeId, criteriaScores]) => {
        Object.entries(criteriaScores).forEach(([criterionId, value]) => {
          if (value > 0) {
            scoresToSave.push({
              alternative_id: alternativeId,
              criterion_id: criterionId,
              value
            });
          }
        });
      });
      
      // Use the dedicated submitScores action instead of updateDecision
      await dispatch(submitScores({
        id: currentDecision.id,
        scores: scoresToSave
      })).unwrap();
      
      // Switch to results tab after saving
      setTabValue(2);
    } catch (error) {
      console.error('Failed to save scores:', error);
      alert('Failed to save scores: ' + (error.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleDeleteDecision = () => {
    if (window.confirm('Are you sure you want to delete this decision? This action cannot be undone.')) {
      dispatch(deleteDecision(id))
        .unwrap()
        .then(() => {
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Failed to delete decision:', error);
        });
    }
  };
  
  const handleOpenInviteModal = () => {
    setInviteModalOpen(true);
  };
  
  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
  };
  
  const handleInvitationSent = (newInvitation) => {
    // Update the decision with the new invitation
    if (currentDecision) {
      const updatedDecision = {
        ...currentDecision,
        invitations: [...currentDecision.invitations, newInvitation]
      };
      
      // Dispatch updated decision to update the Redux store
      dispatch(updateDecision({
        id: currentDecision.id,
        decisionData: updatedDecision
      }));
    }
  };
  
  const handleSharePublicLink = () => {
    if (currentDecision.isPublic) {
      const publicUrl = `${window.location.origin}/public/decisions/${id}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(publicUrl)
        .then(() => {
          alert('Public link copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          // Fallback
          prompt('Copy this public link:', publicUrl);
        });
    }
  };
  
  // Calculate weighted scores for results tab
  const calculateResults = () => {
    if (!currentDecision) return [];
    
    const results = [];
    const allScores = currentDecision.scores;
    
    currentDecision.alternatives.forEach(alternative => {
      let totalWeightedScore = 0;
      let maxPossibleScore = 0;
      const criteriaScores = [];
      
      currentDecision.criteria.forEach(criterion => {
        // Get all scores for this alternative and criterion
        const relevantScores = allScores.filter(
          score => score.alternative_id === alternative.id && score.criterion_id === criterion.id
        );
        
        // Calculate average score if there are any scores
        const averageScore = relevantScores.length > 0
          ? relevantScores.reduce((sum, score) => sum + score.value, 0) / relevantScores.length
          : 0;
        
        // Calculate weighted score
        const weightedScore = averageScore * criterion.weight;
        totalWeightedScore += weightedScore;
        maxPossibleScore += 5 * criterion.weight; // 5 is max rating
        
        criteriaScores.push({
          criterion,
          averageScore,
          weightedScore
        });
      });
      
      // Calculate percentage of max possible score
      const percentageScore = maxPossibleScore > 0
        ? (totalWeightedScore / maxPossibleScore) * 100
        : 0;
      
      results.push({
        alternative,
        criteriaScores,
        totalWeightedScore,
        maxPossibleScore,
        percentageScore
      });
    });
    
    // Sort by total weighted score in descending order
    return results.sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);
  };
  
  // Count the number of collaborators
  const getCollaboratorCount = () => {
    if (!currentDecision) return 0;
    
    // Count accepted invitations
    const acceptedInvitations = currentDecision.invitations.filter(inv => inv.status === 'accepted');
    return acceptedInvitations.length + 1; // +1 for the creator
  };
  
  // Get the list of unique users who have contributed scores
  const getContributorCount = () => {
    if (!currentDecision) return 0;
    
    const userIds = new Set();
    currentDecision.scores.forEach(score => {
      userIds.add(score.user_id);
    });
    
    return userIds.size;
  };
  
  // Modify the isCollaborator function to be more robust and add debugging
  const isCollaborator = () => {
    if (!currentDecision || !user) return false;
    
    // Add console logging to debug
    console.log('Checking if user is collaborator:');
    console.log('Current user email:', user.email);
    console.log('Invitations:', currentDecision.invitations);
    
    // Check if user is in the list of accepted invitations (case insensitive)
    const isAcceptedCollaborator = currentDecision.invitations.some(
      invite => invite.email.toLowerCase() === user.email.toLowerCase() && invite.status === 'accepted'
    );
    
    console.log('Is accepted collaborator:', isAcceptedCollaborator);
    return isAcceptedCollaborator;
  };
  
  // Add a debug function to directly test permissions
  const checkPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(
        `${baseUrl}/api/decisions/${id}/check-permissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Permission check result:', response.data);
      alert(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Permission check failed:', error);
      alert('Permission check failed: ' + (error.response?.data?.message || error.message));
    }
  };
  
  if (loading && !currentDecision) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        {error}
      </Alert>
    );
  }
  
  if (!currentDecision) {
    return (
      <Alert severity="info" sx={{ mt: 3 }}>
        Decision not found.
      </Alert>
    );
  }
  
  const isCreator = currentDecision.creator.id === user?.id;
  const results = calculateResults();
  
  return (
    <Box>
      <Button
        component={RouterLink}
        to="/dashboard"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>
      
      <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {currentDecision.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {currentDecision.is_sample && (
              <Chip 
                label="Sample"
                color="secondary"
              />
            )}
            <Chip 
              label={currentDecision.status}
              color={currentDecision.status === 'active' ? 'success' : 'default'}
            />
          </Box>
        </Box>
        
        {currentDecision.description && (
          <Typography variant="body1" paragraph>
            {currentDecision.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Created by: {currentDecision.creator.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(currentDecision.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(currentDecision.updated_at).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborators: {getCollaboratorCount()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contributors: {getContributorCount()}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          {isCreator && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                component={RouterLink}
                to={`/decisions/${id}/edit`}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteDecision}
              >
                Delete
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShareIcon />}
            onClick={handleOpenInviteModal}
            disabled={!isCreator}
          >
            {isCreator ? 'Invite Collaborators' : 'Invitations (Creator Only)'}
          </Button>
          {currentDecision.isPublic && (
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<PublicIcon />}
              onClick={handleSharePublicLink}
            >
              Share Public Link
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            color="info"
            onClick={checkPermissions}
          >
            Debug Permissions
          </Button>
        </Box>
      </Paper>
      
      {/* Collaborators list */}
      <CollaboratorsList decision={currentDecision} currentUserId={user?.id} />
      
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="decision tabs">
            <Tab label="Overview" id="decision-tab-0" aria-controls="decision-tabpanel-0" />
            <Tab label="Score Alternatives" id="decision-tab-1" aria-controls="decision-tabpanel-1" />
            <Tab 
              label="Results" 
              id="decision-tab-2" 
              aria-controls="decision-tabpanel-2"
              icon={<AssessmentIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Contributors" 
              id="decision-tab-3" 
              aria-controls="decision-tabpanel-3"
              icon={<PeopleIcon />}
              iconPosition="start"
              disabled={currentDecision.scores.length === 0}
            />
          </Tabs>
        </Box>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Criteria
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Weight</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentDecision.criteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell component="th" scope="row">
                          {criterion.name}
                        </TableCell>
                        <TableCell align="right">×{criterion.weight}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Alternatives
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentDecision.alternatives.map((alternative) => (
                      <TableRow key={alternative.id}>
                        <TableCell component="th" scope="row">
                          {alternative.name}
                        </TableCell>
                        <TableCell>{alternative.description || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Scoring Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Score Alternatives
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Rate each alternative against each criterion on a scale of 1-5 stars.
          </Typography>
          
          {/* Add debugging info at the top of the scoring tab */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Debugging Information:</strong>
              </Typography>
              <Typography variant="body2">
                Current User: {user?.name} ({user?.email})
              </Typography>
              <Typography variant="body2">
                Is Creator: {isCreator ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                Is Collaborator: {isCollaborator() ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                Accepted Invitations: {currentDecision.invitations.filter(inv => inv.status === 'accepted').length}
              </Typography>
            </Alert>
          </Box>
          
          {isCreator || isCollaborator() ? (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alternative</TableCell>
                      {currentDecision.criteria.map((criterion) => (
                        <TableCell key={criterion.id}>
                          {criterion.name} (×{criterion.weight})
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentDecision.alternatives.map((alternative) => (
                      <TableRow key={alternative.id}>
                        <TableCell component="th" scope="row">
                          {alternative.name}
                        </TableCell>
                        {currentDecision.criteria.map((criterion) => (
                          <TableCell key={criterion.id}>
                            <Rating
                              name={`rating-${alternative.id}-${criterion.id}`}
                              value={scores[alternative.id]?.[criterion.id] || 0}
                              onChange={(event, newValue) => {
                                handleScoreChange(alternative.id, criterion.id, newValue);
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveScores}
                  disabled={saveLoading || !scoringComplete}
                >
                  {saveLoading ? 'Saving...' : 'Save Scores'}
                </Button>
              </Box>
              
              {!scoringComplete && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please complete scoring for all alternatives and criteria before saving.
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              You need to be an accepted collaborator to score alternatives. 
              The decision creator must send you an invitation link which you need to accept.
            </Alert>
          )}
        </TabPanel>
        
        {/* Results Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Decision Results
          </Typography>
          
          {results.length > 0 && currentDecision.scores.length > 0 ? (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>How scores are calculated:</strong> The results below show the average of all contributions from {getContributorCount()} collaborator{getContributorCount() !== 1 ? 's' : ''}. Each criterion is weighted according to its importance, and the final score determines the ranking.
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Ranking by Weighted Score
                </Typography>
                <Grid container spacing={2}>
                  {results.map((result, index) => (
                    <Grid item xs={12} key={result.alternative.id}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          position: 'relative',
                          borderLeft: index === 0 ? '5px solid #4caf50' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" component="div">
                              {index + 1}. {result.alternative.name}
                              {index === 0 && (
                                <Chip 
                                  label="Top Choice" 
                                  color="success" 
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Score: {result.totalWeightedScore.toFixed(2)} / {result.maxPossibleScore.toFixed(2)} ({result.percentageScore.toFixed(1)}%)
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            width: '60%', 
                            height: '10px', 
                            bgcolor: '#f0f0f0',
                            borderRadius: 5,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              width: `${result.percentageScore}%`, 
                              height: '100%', 
                              bgcolor: index === 0 ? '#4caf50' : '#2196f3',
                              borderRadius: 5
                            }} />
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              {/* Radar Chart */}
              <DecisionChart 
                results={results} 
                criteria={currentDecision.criteria} 
              />
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Detailed Scores by Criteria
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alternative</TableCell>
                      {currentDecision.criteria.map((criterion) => (
                        <TableCell key={criterion.id} align="center">
                          {criterion.name} (×{criterion.weight})
                        </TableCell>
                      ))}
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.alternative.id}>
                        <TableCell component="th" scope="row">
                          {result.alternative.name}
                        </TableCell>
                        {result.criteriaScores.map((score) => (
                          <TableCell key={score.criterion.id} align="center">
                            <Box sx={{ textAlign: 'center' }}>
                              <Rating 
                                value={score.averageScore} 
                                readOnly 
                                precision={0.5}
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                {score.weightedScore.toFixed(1)}
                              </Typography>
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <Typography variant="subtitle2">
                            {result.totalWeightedScore.toFixed(1)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>How to interpret the results:</strong> Each alternative is scored on each criterion using a 5-star rating. The rating is multiplied by the criterion's weight to get the weighted score. The totals are used to rank alternatives, with the highest weighted score being the recommended choice.
                  </Typography>
                </Alert>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              No scoring data available yet. Please complete scoring in the "Score Alternatives" tab.
            </Alert>
          )}
        </TabPanel>
        
        {/* Contributors Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Contributor Scores
          </Typography>
          <Typography variant="body2" paragraph>
            See how each contributor has rated the alternatives in this decision.
          </Typography>
          
          <ContributorScores 
            decision={currentDecision}
            currentUserId={user?.id}
          />
        </TabPanel>
      </Paper>
      
      {/* Invite Modal */}
      <InviteCollaboratorModal
        open={inviteModalOpen}
        onClose={handleCloseInviteModal}
        decisionId={id}
        decisionTitle={currentDecision.title}
        invitations={currentDecision.invitations}
        onInvitationSent={handleInvitationSent}
      />
    </Box>
  );
};

export default DecisionDetails; 