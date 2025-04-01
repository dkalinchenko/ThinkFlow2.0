# Decision Matrix App

A web application to help users make decisions using a weighted decision matrix approach.

## Overview

The Decision Matrix App guides users through a structured decision-making process:

1. **Name Your Decision**: Define what decision you're trying to make
2. **Define Criteria**: Identify the factors important to your decision
3. **Set Weights**: Assign importance to each criterion (1-10)
4. **Add Alternatives**: List the options you're considering
5. **Evaluate Alternatives**: Rate each alternative against each criterion
6. **View Results**: See a calculated score for each alternative

## Features

- Step-by-step guided decision process
- Persistent storage of decisions using SQLite database
- Client-side state management with localStorage backup
- Responsive design using Bootstrap
- Interactive charts for visualizing results
- Form validation and error handling

## Technical Stack

- **Backend**: Node.js with Express
- **Database**: SQLite with Sequelize ORM
- **Frontend**: HTML, CSS, JavaScript
- **Templating**: EJS
- **Styling**: Bootstrap 5
- **Charts**: Chart.js

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd decision-matrix-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   node app.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3333
   ```

## Development

### Project Structure

- `app.js` - Main application file
- `models/` - Database models
- `services/` - Business logic
- `utils/` - Utility functions
- `views/` - EJS templates
- `public/` - Static assets
  - `css/` - Stylesheets
  - `js/` - Client-side JavaScript

### Database

The application uses SQLite for data persistence. The database schema is defined in `models/index.js`.

## Deployment

This application can be deployed to various cloud platforms. Here are the steps for deploying to Render:

1. Create a Render account at https://render.com
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the deployment:
   - Name: decision-matrix-app
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node app.js`
   - Plan: Free

Environment Variables:
- `NODE_ENV`: production
- `PORT`: 3000 (or let Render assign one)
- `SESSION_SECRET`: your-secret-key (replace with a secure random string)

The application uses SQLite by default, which is fine for development but for production, consider using:
- PostgreSQL for the database
- Redis for session storage

## Production Considerations

1. Database: The app currently uses SQLite. For production, consider migrating to PostgreSQL:
   - Create a PostgreSQL database on Render
   - Update database configuration to use PostgreSQL
   - Migrate your data

2. Session Management:
   - Use a production-ready session store
   - Set secure session cookies
   - Use HTTPS

3. Security:
   - Enable CORS if needed
   - Set secure headers
   - Rate limiting for API endpoints
   - Regular security updates

4. Monitoring:
   - Set up error tracking (e.g., Sentry)
   - Monitor application performance
   - Set up logging

## License

ISC 