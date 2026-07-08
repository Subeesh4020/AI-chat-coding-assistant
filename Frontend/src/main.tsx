import { createRoot } from 'react-dom/client'
import { AppProvider } from './contexts/AppContext.tsx';
import { SocketListener } from './components/SocketListeners.tsx';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <SocketListener />
    <App />
  </AppProvider>
)
