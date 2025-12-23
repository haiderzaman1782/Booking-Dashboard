import api from './api.js';
import { transformCall, transformLiveCall } from '../utils/dataTransformers.js';

export const callsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/calls', { params });
    return {
      calls: (response.data.calls || []).map(transformCall),
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/calls/${id}`);
    return transformCall(response.data);
  },

  create: async (callData) => {
    const response = await api.post('/calls', {
      callerName: callData.callername,
      phoneNumber: callData.phonenumber,
      callType: callData.callType,
      status: callData.status || 'completed',
      duration: callData.duration,
      timestamp: callData.timestamp || new Date().toISOString(),
      purpose: callData.purpose,
      notes: callData.notes,
    });
    return transformCall(response.data);
  },

  getLiveCalls: async () => {
    // Get recent completed calls as "live" calls
    const response = await api.get('/calls', {
      params: {
        status: 'completed',
        limit: 10,
      },
    });
    return (response.data.calls || [])
      .filter(call => {
        const callTime = new Date(call.callStartTime);
        const oneHourAgo = new Date(Date.now() - 3600000);
        return callTime > oneHourAgo;
      })
      .map(transformLiveCall);
  },
};

