import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './i18n/i18n';

// Error Overlay Logic (Boot phase)
function showFatalError(msg: string) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#f00;z-index:99999;padding:20px;font-family:monospace;white-space:pre-wrap;overflow:auto;pointer-events:none;';
  overlay.textContent = "FATAL ERROR:\n" + msg;
  document.body.appendChild(overlay);
  console.error("FATAL:", msg);
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error(message, error);
  // Optional: Uncomment to block UI on error
  // showFatalError(`${message}\n${source}:${lineno}:${colno}\n${error?.stack || ''}`);
};

window.onunhandledrejection = (event) => {
  console.error(event.reason);
};

console.log("BOOT: main.tsx reached");

const rootEl = document.getElementById('root');
if (!rootEl) {
  showFatalError("Root element #root not found in index.html");
  throw new Error("Root element missing");
}

// Clear any existing content (like the "PREVIEW OK" text if it existed)
rootEl.innerHTML = '';

try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e: any) {
  showFatalError("Render Crash: " + (e.stack || e.message));
}