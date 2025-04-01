# ThinkFlow - AI-Powered Decision Making Platform

ThinkFlow is a modern web application that helps teams make better decisions using AI-powered guidance. The platform combines structured decision-making frameworks with artificial intelligence to provide intelligent suggestions for criteria, alternatives, and weights.

## Features

- 🤖 AI-powered decision assistance
- 👥 Collaborative decision making
- 📊 Interactive scoring system
- 📈 Visual results and analytics
- 🔒 Secure authentication
- 🌐 Public sharing options

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: PostgreSQL
- AI Integration: OpenAI API
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- OpenAI API key

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/thinkflow.git
cd thinkflow
```

2. Install dependencies:
```bash
# Install backend dependencies
cd thinkflow2.0/server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create `.env` files in both client and server directories:

Server `.env`:
```env
PORT=5001
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=thinkflow
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
```

Client `.env`:
```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_CLIENT_URL=http://localhost:3000
```

## Running the Application

1. Start the backend server:
```bash
cd thinkflow2.0/server
npm start
```

2. Start the frontend development server:
```bash
cd thinkflow2.0/client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Development

- Frontend code is in `thinkflow2.0/client/src`
- Backend code is in `thinkflow2.0/server/src`
- API documentation is available at `/api/docs` when running the server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Material-UI for the beautiful components
- All contributors who have helped shape this project 