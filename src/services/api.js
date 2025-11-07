import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../constants/config';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ApiService = {
  checkHealth: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HEALTH);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getVehicles: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.VEHICLES);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getPaths: async (vehicleType) => {
    try {
      const url = vehicleType 
        ? `${API_ENDPOINTS.PATHS}?vehicle_type=${vehicleType}`
        : API_ENDPOINTS.PATHS;
      const response = await apiClient.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  startSimulation: async (params) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SIMULATE, params);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getJobStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.JOB_STATUS}/${jobId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getDownloadUrl: (filename) => {
    return `${API_URL}${API_ENDPOINTS.DOWNLOAD}/${filename}`;
  },
};

export default ApiService;