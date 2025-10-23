// Change from HTTP to HTTPS
const PROD_API_URL = 'https://doppler-simulator.duckdns.org';

export const API_URL = PROD_API_URL;

export const API_ENDPOINTS = {
  INFO: '/api/info',
  VEHICLES: '/api/vehicles',
  PATHS: '/api/paths',
  SIMULATE: '/api/simulate',
  JOB_STATUS: '/api/job',
  DOWNLOAD: '/api/download',
  HEALTH: '/health',
};

export const POLLING_INTERVAL = 2000;
export const DEFAULT_AUDIO_DURATION = 5;