/**
 * OptiMind App Starter Script
 * 
 * This script starts both the backend server and the React frontend
 * together, ensuring proper error handling and process management.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'client');

// Function to kill processes on specific ports
const killProcessOnPort = (port) => {
  try {
    // This works on macOS and Linux
    console.log(`Attempting to kill process on port ${port}...`);
    spawn('bash', ['-c', `lsof -ti:${port} | xargs kill -9`]);
    console.log(`Any process on port ${port} has been terminated`);
  } catch (error) {
    console.log(`No process running on port ${port} or failed to kill: ${error.message}`);
  }
};

// Kill any existing processes
killProcessOnPort(5001); // Backend port
killProcessOnPort(3000); // Frontend port

console.log('Starting OptiMind application...');

// Start the server
console.log('\n--- Starting Backend Server ---');
const server = spawn('node', ['src/simplified-index.js'], {
  cwd: serverPath,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error(`Failed to start server: ${error.message}`);
});

// Wait a bit to make sure server is up before starting the client
setTimeout(() => {
  // Start the client
  console.log('\n--- Starting Frontend ---');
  const client = spawn('npm', ['start'], {
    cwd: clientPath,
    stdio: 'inherit',
    shell: true
  });

  client.on('error', (error) => {
    console.error(`Failed to start client: ${error.message}`);
  });

  // Handle app shutdown
  const cleanup = () => {
    console.log('\nShutting down OptiMind application...');
    server.kill();
    client.kill();
    process.exit(0);
  };

  // Listen for termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

}, 2000); // Wait 2 seconds before starting client

console.log('\nOptiMind starter script is running. Press Ctrl+C to stop all processes.\n'); 