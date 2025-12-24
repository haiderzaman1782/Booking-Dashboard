import api from './api.js';
import { transformPayment } from '../utils/dataTransformers.js';

export const paymentsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return {
      payments: (response.data.payments || []).map(transformPayment),
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return transformPayment(response.data);
  },

  create: async (paymentData) => {
    const response = await api.post('/payments', {
      customerName: paymentData.customerName,
      appointmentId: paymentData.appointmentId || null,
      paymentMethod: paymentData.paymentMethod,
      amount: paymentData.amount,
      status: paymentData.status || 'pending',
      date: paymentData.date,
      timestamp: paymentData.timestamp || new Date().toISOString(),
      refundStatus: paymentData.refundStatus,
      service: paymentData.service,
      userId: paymentData.userId || null,
    });
    return transformPayment(response.data);
  },

  update: async (id, paymentData) => {
    const response = await api.put(`/payments/${id}`, {
      status: paymentData.status,
      failureReason: paymentData.failureReason,
    });
    return transformPayment(response.data);
  },
};

