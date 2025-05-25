// Import polyfills first
import './utils/polyfills.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Check if environment variables are loaded
if (!import.meta.env.VITE_API_URL) {
  console.warn('Environment variables not loaded. Make sure you have a .env file with the required variables.');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
