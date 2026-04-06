// Centralized API configuration for F1 Strategy Engine
// In production (Netlify), this uses VITE_API_URL environment variable.
// Locally, it defaults to your local Python backend.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log(`[API Config] Connecting to backend at: ${API_BASE_URL}`);
