# Teams Clone Frontend

The React frontend for the Teams Clone application.

## Technologies Used

- **React**: UI library
- **Vite**: Build tool
- **Material UI**: Component library for styling
- **Socket.IO Client**: Real-time communication
- **Simple-Peer**: WebRTC abstraction
- **Auth0**: Authentication

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:5000
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-identifier
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Features

- Real-time chat with read receipts
- File sharing in chat
- Video calling with WebRTC
- User authentication with Auth0+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
