import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { EventsContextprovider } from '../context/eventcontext';
import { AuthContextProvider } from '../context/authcontext';
import { OrganizersContextProvider } from '../context/organizercontext';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (typeof resource === 'string' && resource.startsWith('/api')) {
    resource = apiUrl + resource;
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <EventsContextprovider>
        <OrganizersContextProvider>
          <App />
        </OrganizersContextProvider>
      </EventsContextprovider>
    </AuthContextProvider>
  </StrictMode>,
)
