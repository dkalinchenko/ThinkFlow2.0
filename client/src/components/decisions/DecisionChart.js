import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const DecisionChart = ({ results, criteria }) => {
  const theme = useTheme();

  if (!results || !results.length || !criteria || !criteria.length) {
    return null;
  }

  // Prepare data for radar chart
  const getChartData = () => {
    // Create data points for each criterion
    return criteria.map(criterion => {
      const dataPoint = {
        criterion: criterion.name,
        fullMark: 5, // Maximum score is 5
      };

      // Add a data point for each alternative
      results.forEach(result => {
        // Check if we're using the PublicDecisionView data structure (object with keys)
        // or the regular DecisionDetails data structure (array with find method)
        let score = null;
        
        if (result.criteriaScores && typeof result.criteriaScores === 'object' && !Array.isArray(result.criteriaScores)) {
          // PublicDecisionView structure (object with criterion IDs as keys)
          score = result.criteriaScores[criterion.id];
        } else if (Array.isArray(result.criteriaScores)) {
          // Regular structure (array with find method)
          score = result.criteriaScores.find(
            s => s.criterion?.id === criterion.id || s.criterionId === criterion.id
          );
        }
        
        // Use the non-weighted score
        if (score) {
          dataPoint[result.alternativeName || result.alternative?.name] = 
            score.score || score.averageScore || 0;
        } else {
          dataPoint[result.alternativeName || result.alternative?.name] = 0;
        }
      });

      return dataPoint;
    });
  };

  const chartData = getChartData();

  // Generate colors for each alternative
  const getColor = (index) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      // Add fallback colors for more alternatives
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#ff8042',
      '#a4de6c',
    ];
    
    return colors[index % colors.length];
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 6 }}>
      <Typography variant="h6" gutterBottom>
        Comparison by Criteria
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This radar chart shows how each alternative scores on each criterion (before weighting). 
        The further from the center, the higher the score.
      </Typography>
      
      <Box sx={{ width: '100%', height: 450 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="70%" 
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 30, left: 30 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="criterion" />
            <PolarRadiusAxis angle={30} domain={[0, 5]} />
            
            {results.map((result, index) => (
              <Radar
                key={result.alternativeId || result.alternative?.id}
                name={result.alternativeName || result.alternative?.name}
                dataKey={result.alternativeName || result.alternative?.name}
                stroke={getColor(index)}
                fill={getColor(index)}
                fillOpacity={0.2}
              />
            ))}
            
            <Tooltip formatter={(value) => [value.toFixed(1), 'Score']} />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              verticalAlign="bottom"
              height={36}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Note: This visualization shows raw scores before weighting. The final rankings apply weights to these scores.
      </Typography>
    </Paper>
  );
};

export default DecisionChart; 