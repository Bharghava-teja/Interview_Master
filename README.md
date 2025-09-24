# Interview Master

A comprehensive interview preparation platform featuring both mock interviews and secure interview capabilities.

## Features

- **Mock Interview Mode**: Practice interviews with AI-generated questions
- **Secure Interview Mode**: Conduct secure interviews with webcam monitoring
- **Resume Upload**: Upload and analyze resumes for targeted questions
- **Real-time Feedback**: Get instant feedback on your interview performance
- **Question Generation**: AI-powered question generation based on job roles
- **Session Management**: Track and manage interview sessions

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **File Upload**: Multer for resume processing
- **Real-time Features**: WebSocket support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Bharghava-teja/Interview_Master.git
cd Interview_Master
```

2. Install client dependencies:
```bash
cd client
npm install
```

3. Install server dependencies:
```bash
cd ../server
npm install
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Configure your MongoDB connection string and other required variables

### Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration for frontend deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

