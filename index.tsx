import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './src/app/App.tsx';
import './src/i18n/i18n.ts';

// Error Overlay Logic (Boot phase)
function showFatalError(msg: string) {
  const overlay = document.getElementById('fatal-error-overlay');
  const content = document.getElementById('error-content');
  if (overlay && content) {
    content.textContent = msg;
    overlay.style.display = 'block';
  }
  console.error("APEX BOOT ERROR:", msg);
}

window.onerror = (message, source, lineno, colno, error) => {
  showFatalError(`${message}\nAt: ${source}:${lineno}:${colno}\n\nStack:\n${error?.stack || 'No stack trace'}`);
};

window.onunhandledrejection = (event) => {
  showFatalError(`Unhandled Promise Rejection: ${event.reason}`);
};

const rootEl = document.getElementById('root');
if (!rootEl) {
  showFatalError("CRITICAL: Root element #root not found in DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e: any) {
    showFatalError("APEX OPS: System crash during initial render.\n" + (e.stack || e.message));
  }
}