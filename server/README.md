# Server Setup

## Environment Setup
Create a `.env` file in this directory with the following content:

```
MONGO_URI=mongodb://localhost:27017/interview-master
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
```

## Installation & Running
1. Install dependencies: `npm install`
2. Start MongoDB (if running locally)
3. Start the server: `node server.js`
4. Server will run on http://localhost:5000

## API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/password` - Update password (protected)

## Testing
The server includes JWT authentication and bcrypt password hashing. All protected routes require a valid JWT token in the Authorization header.