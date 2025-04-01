import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import DecisionChart from '../../components/decisions/DecisionChart';

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

const PublicDecisionView = () => {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchPublicDecision = async () => {
      try {
        setLoading(true);
        console.log('Fetching public decision with ID:', id);
        
        // Use the API URL from environment variable or fallback to localhost
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const apiUrl = `${baseUrl}/api/public/decisions/${id}`;
        console.log('Making API request to:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('API response:', response.data);
        
        setDecision(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching public decision:', err);
        setError(err.response?.data?.message || 'Error loading decision');
        setLoading(false);
      }
    };
    
    fetchPublicDecision();
  }, [id]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const calculateResults = () => {
    if (!decision) return null;
    
    const results = {};
    
    // Initialize results for each alternative
    decision.alternatives.forEach(alt => {
      results[alt.id] = {
        alternativeId: alt.id,
        alternativeName: alt.name,
        totalScore: 0,
        weightedScore: 0,
        criteriaScores: {}
      };
    });
    
    // Calculate average scores for each criterion and alternative
    decision.criteria.forEach(criterion => {
      decision.alternatives.forEach(alt => {
        // Filter scores for this alternative and criterion
        const relevantScores = decision.scores.filter(
          score => score.alternative_id === alt.id && score.criterion_id === criterion.id
        );
        
        // Calculate average score
        const averageScore = relevantScores.length 
          ? relevantScores.reduce((acc, score) => acc + parseFloat(score.value), 0) / relevantScores.length
          : 0;
        
        // Calculate weighted score
        const weightedScore = averageScore * parseFloat(criterion.weight);
        
        // Update results
        results[alt.id].criteriaScores[criterion.id] = {
          criterionId: criterion.id,
          criterionName: criterion.name,
          score: averageScore,
          weightedScore: weightedScore
        };
        
        results[alt.id].totalScore += averageScore;
        results[alt.id].weightedScore += weightedScore;
      });
    });
    
    // Convert to array and sort by weighted score (descending)
    return Object.values(results).sort((a, b) => b.weightedScore - a.weightedScore);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 3, p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<ArrowBackIcon />}
        >
          Back to Home
        </Button>
      </Box>
    );
  }
  
  if (!decision) {
    return (
      <Alert severity="info" sx={{ mt: 3 }}>
        Decision not found.
      </Alert>
    );
  }
  
  const results = calculateResults();
  
  return (
    <Box>
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Home
      </Button>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        You are viewing a public decision. <RouterLink to="/login">Sign in</RouterLink> to create your own decisions.
      </Alert>
      
      <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {decision.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label="Public"
              color="success"
            />
          </Box>
        </Box>
        
        {decision.description && (
          <Typography variant="body1" paragraph>
            {decision.description}
          </Typography>
        )}
        
        <Typography variant="subtitle2" color="text.secondary">
          Created by: {decision.creator.name}
        </Typography>
      </Paper>
      
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="decision tabs">
            <Tab label="Overview" id="decision-tab-0" aria-controls="decision-tabpanel-0" />
            <Tab 
              label="Results" 
              id="decision-tab-1" 
              aria-controls="decision-tabpanel-1"
              icon={<AssessmentIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>Criteria</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Weight</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {decision.criteria.map(criterion => (
                    <TableRow key={criterion.id}>
                      <TableCell>{criterion.name}</TableCell>
                      <TableCell align="right">{criterion.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="h6" gutterBottom>Alternatives</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {decision.alternatives.map(alternative => (
                <Card key={alternative.id} sx={{ width: 300, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">{alternative.name}</Typography>
                    {alternative.description && (
                      <Typography variant="body2" color="text.secondary">
                        {alternative.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </TabPanel>
        
        {/* Results Tab */}
        <TabPanel value={tabValue} index={1}>
          {decision.scores.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>Decision Matrix Results</Typography>
              
              {/* Results visualization */}
              <Box sx={{ mb: 6, mt: 2 }}>
                <DecisionChart results={results} criteria={decision.criteria} />
              </Box>
              
              <Typography variant="h6" gutterBottom>Score Breakdown</Typography>
              
              {/* Results table */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alternative</TableCell>
                      {decision.criteria.map(criterion => (
                        <TableCell key={criterion.id} align="center">
                          {criterion.name} (x{criterion.weight})
                        </TableCell>
                      ))}
                      <TableCell align="center">Total Score</TableCell>
                      <TableCell align="center">Weighted Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map(result => (
                      <TableRow 
                        key={result.alternativeId}
                        sx={{ 
                          bgcolor: results.indexOf(result) === 0 ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                        }}
                      >
                        <TableCell>{result.alternativeName}</TableCell>
                        {decision.criteria.map(criterion => (
                          <TableCell key={criterion.id} align="center">
                            {result.criteriaScores[criterion.id]?.score.toFixed(1) || '-'}
                          </TableCell>
                        ))}
                        <TableCell align="center">{result.totalScore.toFixed(1)}</TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: results.indexOf(result) === 0 ? 'bold' : 'inherit'
                          }}
                        >
                          {result.weightedScore.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Alert severity="info">
              No scores available for this decision.
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PublicDecisionView; 