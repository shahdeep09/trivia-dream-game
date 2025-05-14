
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadSounds } from './utils/soundUtils'

// Preload sound files when the app starts
preloadSounds();

createRoot(document.getElementById("root")!).render(<App />);
