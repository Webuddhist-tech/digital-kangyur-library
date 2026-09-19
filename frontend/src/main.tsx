import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/rich-text.css'
import "./utils/i18n"

createRoot(document.getElementById("root")!).render(<App />);
