# Teams Clone

A Microsoft Teams clone built with React, Node.js, Socket.IO, and WebRTC.

## Features

- **Chat**
  - 1-to-1 messaging
  - Message timestamps
  - Image/file sharing
  - Read receipts
- **Video & Voice Calling**
  - 1-to-1 video calls using WebRTC
- **User**
  - Registration/Login with Auth0

## Technologies Used

### Frontend

- **Framework**: React.js with Vite
- **Real-time Communication**: Socket.IO
- **Video Calls**: WebRTC with simple-peer
- **Styling**: Material UI

### Backend

- **Framework**: Node.js with Express
- **Real-time Engine**: Socket.IO (for chat + signalling)
- **Database**: MongoDB (for messages, users)
- **Authentication**: Auth0
- **Caching**: Redis
- **API Gateway**: APIgee (not fully implemented in this demo)

## Getting Started

### Prerequisites

- Node.js 14+ installed
- MongoDB installed and running
- Redis installed and running

### Configuration

1. Create `.env` files in both frontend and backend directories:

#### Backend `.env` file:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/teams-clone
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-identifier
```

#### Frontend `.env` file:

```
VITE_API_URL=http://localhost:5000
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-identifier
```

### Installation

1. Clone the repository:

```
git clone <repository-url>
cd teams-clone
```

2. Install backend dependencies:

```
cd backend
npm install
```

3. Install frontend dependencies:

```
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:

```
cd backend
npm run dev
```

2. Start the frontend:

```
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
teams-clone/
├─ frontend/             # React frontend
│  ├─ public/            # Static files
│  ├─ src/               # Source code
│  │  ├─ assets/         # Images and static assets
│  │  ├─ components/     # React components
│  │  ├─ contexts/       # Context providers
│  │  ├─ hooks/          # Custom React hooks
│  │  ├─ pages/          # Page components
│  │  ├─ services/       # API and service classes
│  │  └─ utils/          # Utility functions
├─ backend/              # Node.js backend
│  ├─ models/            # MongoDB models
│  ├─ routes/            # API routes
│  ├─ middleware/        # Express middleware
│  ├─ utils/             # Utility functions
│  └─ uploads/           # File uploads (created at runtime)
```

## Deployment Instructions

### Backend Deployment

#### Option 1: Deploy on AWS EC2

1. Launch an EC2 instance (recommended: t3.medium or higher)
2. Install Node.js, MongoDB, and Redis
3. Clone the repository and install dependencies
4. Use PM2 to manage the Node.js process:
   ```
   npm install -g pm2
   cd backend
   pm2 start index.js --name teams-clone-api
   ```

#### Option 2: Deploy on Heroku

1. Create a Heroku account and install Heroku CLI
2. Add the following buildpacks:
   - heroku/nodejs
3. Add MongoDB and Redis add-ons:
   ```
   heroku addons:create mongolab
   heroku addons:create heroku-redis
   ```
4. Deploy the app:
   ```
   git subtree push --prefix backend heroku main
   ```

### Frontend Deployment

#### Option 1: Deploy on Netlify

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```
2. Deploy to Netlify:
   - Connect your GitHub repository to Netlify
   - Set the build command to `cd frontend && npm run build`
   - Set the publish directory to `frontend/dist`
   - Add environment variables in the Netlify dashboard

#### Option 2: Deploy on Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
2. Deploy to Vercel:
   ```
   cd frontend
   vercel
   ```

### Configuration for Production

1. Update environment variables for production:

   - Set `NODE_ENV=production`
   - Update URLs to use your production domain
   - Configure CORS in the backend to allow requests from your frontend domain

2. Set up a custom domain for your application

3. Configure SSL certificates for secure connections

## Scaling the Application

To handle more users and improve performance:

1. Scale horizontally by adding more backend instances behind a load balancer
2. Use Redis for session storage and as a Socket.IO adapter for multi-server setups
3. Consider using MongoDB Atlas for a managed database solution
4. Implement proper caching strategies for frequently accessed data
5. Use a CDN for static assets
