import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './serviceWorkerRegistration'
import socketService from './services/socketService'

// Register the service worker for PWA functionality
registerServiceWorker()

// Initialize socket service for real-time notifications
socketService.initialize()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
