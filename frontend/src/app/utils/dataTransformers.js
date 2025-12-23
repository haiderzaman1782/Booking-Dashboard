/**
 * Transform backend appointment to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformAppointment = (apt) => {
  return {
    id: apt.id?.toString() || `APT${String(apt.id).padStart(3, '0')}`,
    patientName: apt.patientName || apt.user?.name || 'Unknown',
    date: apt.appointmentDate || apt.date,
    time: apt.appointmentTime || formatTime(apt.appointmentTime) || apt.time,
    service: apt.service || apt.serviceName,
    status: apt.status,
    phone: apt.phone || apt.user?.phone,
  };
};

/**
 * Transform backend payment to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformPayment = (payment) => {
  return {
    id: payment.id?.toString() || `PAY${String(payment.id).padStart(3, '0')}`,
    appointmentId: payment.appointmentId?.toString() || payment.appointmentId,
    customerName: payment.customername || payment.user?.name,
    service: payment.service || payment.appointment?.service,
    amount: parseFloat(payment.amount) || payment.amount,
    status: payment.status,
    date: payment.paymentDate || payment.createdAt?.split('T')[0] || payment.date,
    timestamp: payment.paymentTimestamp || payment.createdAt || payment.timestamp,
    paymentMethod: payment.paymentmethod,
    transactionId: payment.transactionId || `txn_${payment.id}`,
    callReference: payment.callReference || `CALL${String(payment.id).padStart(3, '0')}`,
    invoiceNumber: payment.invoiceNumber || `INV-${new Date().getFullYear()}-${String(payment.id).padStart(3, '0')}`,
    failureReason: payment.failureReason,
  };
};

/**
 * Transform backend call to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformCall = (call) => {
  // Use duration from database if available, otherwise calculate
  let duration = call.duration;
  if (!duration && call.callDurationSeconds) {
    duration = formatDuration(call.callDurationSeconds);
  } else if (!duration && call.callStartTime && call.callEndTime) {
    const startTime = new Date(call.callStartTime);
    const endTime = new Date(call.callEndTime);
    duration = formatDuration(Math.floor((endTime - startTime) / 1000));
  }

  // Get status from database - map directly to frontend
  let status = call.callStatus || call.status;
  
  // Normalize status to lowercase for comparison
  const dbStatus = status?.toLowerCase();

  return {
    id: call.id?.toString() || `CALL${String(call.id).padStart(3, '0')}`,
    callerName: call.callername || call.user?.name || 'Unknown',
    phoneNumber: call.phonenumber || call.user?.phone || '',
    callType: call.callType || call.calltype || 'incoming',
    // Map DB statuses directly: "completed", "bounced", "failed" → show as-is
    status: dbStatus === 'completed' ? 'completed' 
           : dbStatus === 'bounced' ? 'bounced'
           : dbStatus === 'failed' ? 'failed'
           : 'completed', // Default to completed if status is unknown
    duration: duration || '00:00',
    timestamp: call.callTimestamp || call.callStartTime || call.timestamp,
    purpose: call.purpose || 'Unknown',
    notes: call.notes || '',
  };
};

/**
 * Transform backend user to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformUser = (user, stats = {}) => {
  return {
    id: user.id?.toString() || `USR${String(user.id).padStart(3, '0')}`,
    fullName: user.fullname || user.fullName || 'Unknown User', // Add fallback
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'customer',
    status: user.status || 'active',
    totalAppointments: user.totalAppointments || stats.appointments || 0,
    lastActivity: user.lastActivity || user.updatedAt || user.createdAt,
    createdAt: user.createdAt,
    avatar: user.avatar && user.avatar.trim() !== '' 
      ? (user.avatar.startsWith('http') 
          ? user.avatar 
          : user.avatar.startsWith('/uploads')
            ? `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('/api', '')}${user.avatar}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.fullName || 'User')}&background=random`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.fullName || 'User')}&background=random`,
    failedCalls: user.failedCalls || stats.failedCalls || 0,
    failedPayments: user.failedPayments || stats.failedPayments || 0,
  };
};

/**
 * Transform backend call to live call format
 * Maintains exact field names expected by LiveCallsPanel component
 */
export const transformLiveCall = (call) => {
  let duration = call.duration;
  if (!duration && call.callDurationSeconds) {
    duration = formatDuration(call.callDurationSeconds);
  }

  return {
    id: call.id?.toString() || `CALL${String(call.id).padStart(3, '0')}`,
    callerName: call.callerName || call.user?.name || 'Unknown',
    duration: duration || '00:00',
    status: call.callStatus === 'completed' ? 'active' : 'on-hold',
    purpose: call.purpose || 'Unknown',
  };
};

// Helper functions
function formatTime(timeString) {
  if (!timeString) return '';
  // If already in "09:00 AM" format, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  // Convert TIME format (HH:MM:SS) to "HH:MM AM/PM"
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    const hour = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return timeString;
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
