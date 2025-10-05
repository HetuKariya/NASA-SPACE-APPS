// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LocationProvider } from './contexts/LocationProvider.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <LocationProvider>
    <App />
  </LocationProvider>
  // </StrictMode>,
)
