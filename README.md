# ThinkFlow 2.0 (formerly OptiMind) - Decision Matrix App

A collaborative decision-making application that helps teams and individuals make better decisions through weighted criteria analysis.

## Features

- Create and save decision matrices
- Invite collaborators to score alternatives against weighted criteria
- View real-time or periodic aggregation of averaged results
- Secure authentication and authorization
- Responsive UI for desktop and mobile use

## Tech Stack

- **Frontend**: React with Redux, Material-UI
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Updates**: Socket.IO

## Getting Started - Local Development

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository
   ```
   git clone https://github.com/dkalinchenko/ThinkFlow2.0.git
   cd ThinkFlow2.0
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables:
   ```
   # Copy the example env file and modify as needed
   cp server/.env.example server/.env
   ```

4. Set up the database:
   ```
   # Create the database
   createdb optimind

   # The application will automatically create tables on first run
   ```

5. Start the development servers:
   ```
   # Option 1: Use the convenience script
   cd ..
   node start-app.js
   
   # Option 2: Start services separately
   # Terminal 1 - Start the backend server
   cd server
   npm run dev
   
   # Terminal 2 - Start the frontend server
   cd client
   npm start
   ```

## Deployment on Render.com

This application is set up to be easily deployed on Render.com with PostgreSQL.

### Database Setup on Render

1. Log in to your Render account
2. Navigate to "PostgreSQL" in the dashboard
3. Click "New PostgreSQL"
4. Configure your database:
   - Name: `thinkflow-db` (or your preferred name)
   - Database: `thinkflow`
   - User: Let Render generate this
   - Choose your region and plan
5. Click "Create Database"
6. Save the connection details provided by Render

### Backend Deployment

1. From the Render dashboard, click "New Web Service"
2. Connect your GitHub repository
3. Configure the web service:
   - Name: `thinkflow-api` (or your preferred name)
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node src/index.js`
   - Select plan
4. Add the following environment variables (from your database):
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=[Your Render PostgreSQL Host]
   DB_PORT=5432
   DB_NAME=thinkflow
   DB_USER=[Your Render PostgreSQL User]
   DB_PASSWORD=[Your Render PostgreSQL Password]
   JWT_SECRET=[Generate a Strong Secret]
   JWT_EXPIRATION=24h
   CLIENT_URL=[Your Frontend URL]
   ```
5. Click "Create Web Service"

### Frontend Deployment

1. From the Render dashboard, click "New Static Site"
2. Connect your GitHub repository
3. Configure the static site:
   - Name: `thinkflow` (or your preferred name)
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
4. Add environment variables:
   ```
   REACT_APP_API_URL=[Your Backend URL]
   ```
5. Click "Create Static Site"

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend API
- `server/src/models/` - Database models (Sequelize)
- `server/src/controllers/` - API controllers
- `server/src/routes/` - API routes
- `server/src/middleware/` - Custom middleware
- `server/src/config/` - Configuration files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 