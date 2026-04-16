// Embedded Base64 SVG Logo to ensure it loads in all environments (offline/preview/restricted networks)
// Shield design with Apex Gold (#d4af37) and Black (#121212)
const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f3e5ab;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50 115 C50 115 95 90 95 30 V10 L50 0 L5 10 V30 C5 90 50 115 50 115 Z" fill="#121212" stroke="url(#goldGrad)" stroke-width="4" />
  <text x="50" y="80" font-family="sans-serif" font-weight="bold" font-size="55" text-anchor="middle" fill="url(#goldGrad)">A</text>
</svg>`;

const BASE64_LOGO = `data:image/svg+xml;base64,${btoa(SVG_LOGO)}`;

export const APEX_LOGO_URL = BASE64_LOGO;

export const APP_NAME = "Apex Ops";

const LOGO_STORAGE_KEY = "apex_logo_data_url";

export function getLogo(): string {
  try {
    const custom = localStorage.getItem(LOGO_STORAGE_KEY);
    if (custom) return custom;
  } catch (e) {
    console.error("Error reading logo from storage", e);
  }
  return APEX_LOGO_URL;
}

export function setCustomLogo(dataUrl: string): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
  } catch (e) {
    console.error("Error saving logo to storage", e);
  }
}

export function clearCustomLogo(): void {
  try {
    localStorage.removeItem(LOGO_STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing logo from storage", e);
  }
}