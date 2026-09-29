import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Self-hosted variable font. No request to Google, no layout shift.
import '@fontsource-variable/geist';

import './index.css';
import './styles/editorial.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
