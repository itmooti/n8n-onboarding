import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getInitialPlanFromURL } from './store/onboarding';

// Parse ?plan= query param before rendering
getInitialPlanFromURL();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
