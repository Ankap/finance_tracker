import React from 'react';
import ReactDOM from 'react-dom/client';
// global CSS is imported in pages/_app.js for Next.js
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
