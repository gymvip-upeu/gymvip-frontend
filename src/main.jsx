import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './themes/plans.css';
import './themes/members.css';
import './themes/catalog.css';
import { initSentry } from './config/sentry';

// Inicialización centralizada de observabilidad con Sentry
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
