import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import NewDecision from './pages/decisions/NewDecision';
import DecisionDetails from './pages/decisions/DecisionDetails';
import EditDecision from './pages/decisions/EditDecision';
import AcceptInvitation from './pages/auth/AcceptInvitation';
import Landing from './pages/Landing';
import PublicDecisionView from './pages/decisions/PublicDecisionView';
import { getCurrentUser } from './features/auth/authSlice';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <Routes>
      {/* Main landing page route */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
      
      {/* Public decision view - no auth required */}
      <Route path="/public/decisions/:id" element={<Layout><PublicDecisionView /></Layout>} />
      
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route 
        path="/invite/:token" 
        element={
          <Layout>
            <AcceptInvitation />
          </Layout>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <Layout>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Layout>
        } 
      />
      <Route 
        path="/decisions/new" 
        element={
          <Layout>
            <ProtectedRoute>
              <NewDecision />
            </ProtectedRoute>
          </Layout>
        } 
      />
      <Route 
        path="/decisions/:id" 
        element={
          <Layout>
            <ProtectedRoute>
              <DecisionDetails />
            </ProtectedRoute>
          </Layout>
        } 
      />
      <Route 
        path="/decisions/:id/edit" 
        element={
          <Layout>
            <ProtectedRoute>
              <EditDecision />
            </ProtectedRoute>
          </Layout>
        } 
      />
      <Route 
        path="*" 
        element={
          <Layout>
            <Box sx={{ my: 4, textAlign: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                404: Page Not Found
              </Typography>
              <Typography variant="body1">
                The page you are looking for does not exist.
              </Typography>
            </Box>
          </Layout>
        } 
      />
    </Routes>
  );
}

export default App; 