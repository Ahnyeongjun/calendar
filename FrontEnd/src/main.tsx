import { createRoot } from 'react-dom/client';
import { initSentry } from './sentry';
import App from './App.tsx';
import './index.css';

// Sentry 초기화
initSentry();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

createRoot(container).render(<App />);
