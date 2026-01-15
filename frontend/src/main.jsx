import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { useThemeStore } from './store/themeStore'

// Initialize dark mode from storage
const darkMode = localStorage.getItem('theme-storage')
  ? JSON.parse(localStorage.getItem('theme-storage')).state.darkMode
  : false;

if (darkMode) {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
