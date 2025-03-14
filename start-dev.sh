#!/bin/bash

# Kill any processes running on our ports
echo "Cleaning up any previous processes..."
kill $(lsof -t -i:5001) 2>/dev/null || true
kill $(lsof -t -i:3000) 2>/dev/null || true

# Start the simplified server
echo "Starting server..."
cd server && node src/simplified-index.js &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Start the client
echo "Starting client..."
cd ../client && npm start &
CLIENT_PID=$!

# Handle cleanup when script is terminated
cleanup() {
  echo "Shutting down..."
  kill $SERVER_PID
  kill $CLIENT_PID
  exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Keep script running
echo "Development environment started"
echo "Server running at http://localhost:5001"
echo "Client running at http://localhost:3000"
echo "Press Ctrl+C to stop"
wait 