import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const ContributorScores = ({ decision, currentUserId }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!decision || !decision.scores.length) {
    return null;
  }

  // Group scores by user
  const getUserScores = () => {
    const scoresByUser = {};
    
    decision.scores.forEach(score => {
      if (!scoresByUser[score.user_id]) {
        scoresByUser[score.user_id] = {
          userId: score.user_id,
          userName: score.user_name || 'Unknown User',
          isCreator: score.user_id === decision.creator.id,
          isCurrentUser: score.user_id === currentUserId,
          scores: [],
        };
      }
      
      scoresByUser[score.user_id].scores.push(score);
    });
    
    // Convert to array and sort by creator first, then current user, then others
    return Object.values(scoresByUser).sort((a, b) => {
      if (a.isCreator && !b.isCreator) return -1;
      if (!a.isCreator && b.isCreator) return 1;
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      return a.userName.localeCompare(b.userName);
    });
  };

  const userScores = getUserScores();

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getScoreByAlternativeCriterion = (scores, alternativeId, criterionId) => {
    const score = scores.find(
      s => s.alternative_id === alternativeId && s.criterion_id === criterionId
    );
    return score ? score.value : null;
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Individual Contributor Scores
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        View how each contributor scored the alternatives. Expand each contributor to see their detailed scores.
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {userScores.map((userScore, index) => (
        <Accordion
          key={userScore.userId}
          expanded={expanded === `panel${index}`}
          onChange={handleChange(`panel${index}`)}
          sx={{ 
            mb: 1,
            '&:before': { display: 'none' },
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '4px !important',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}bh-content`}
            id={`panel${index}bh-header`}
            sx={{ borderRadius: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ bgcolor: userScore.isCreator ? theme.palette.primary.main : theme.palette.secondary.main }}>
                {userScore.isCreator ? <StarIcon /> : <PersonIcon />}
              </Avatar>
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography variant="subtitle1">
                  {userScore.userName}
                  {userScore.isCreator && (
                    <Chip
                      label="Creator"
                      color="primary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {userScore.isCurrentUser && (
                    <Chip
                      label="You"
                      color="secondary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Provided {userScore.scores.length} scores
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Alternative</TableCell>
                    {decision.criteria.map(criterion => (
                      <TableCell key={criterion.id} align="center">
                        {criterion.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {decision.alternatives.map(alternative => (
                    <TableRow key={alternative.id}>
                      <TableCell component="th" scope="row">
                        {alternative.name}
                      </TableCell>
                      {decision.criteria.map(criterion => {
                        const score = getScoreByAlternativeCriterion(
                          userScore.scores,
                          alternative.id,
                          criterion.id
                        );
                        return (
                          <TableCell key={criterion.id} align="center">
                            {score !== null ? (
                              <Rating
                                value={score}
                                readOnly
                                size="small"
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};

export default ContributorScores; 