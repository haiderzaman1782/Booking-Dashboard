import pool from '../config/database.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Call } from '../models/Call.js';

// Helper function to generate random dates within current month
const randomDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Generate date for current month only
const randomDateThisMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return randomDate(startOfMonth, endOfMonth);
};

const randomDateTime = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

// Generate datetime for current month only
const randomDateTimeThisMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return randomDateTime(startOfMonth, endOfMonth);
};

// Generate random time
const randomTime = () => {
  const hours = String(Math.floor(Math.random() * 12) + 9).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hours}:${minutes} ${Math.random() > 0.5 ? 'AM' : 'PM'}`;
};

// Generate random duration
const randomDuration = () => {
  const minutes = Math.floor(Math.random() * 30) + 2;
  return `${minutes}m ${Math.floor(Math.random() * 60)}s`;
};

// Sample data arrays
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Amy', 'Mark', 'Angela',
  'Donald', 'Lisa', 'Steven', 'Nancy', 'Paul', 'Karen', 'Andrew', 'Betty'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
];

const services = [
  'General Consultation', 'Dental Checkup', 'Eye Examination', 'Cardiology',
  'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Neurology',
  'Psychiatry', 'Physical Therapy', 'Lab Tests', 'X-Ray', 'Ultrasound',
  'Blood Work', 'Vaccination', 'Follow-up', 'Emergency', 'Surgery Consultation'
];

const agents = [
  'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez', 'Dr. David Kim',
  'Dr. Lisa Anderson', 'Dr. Robert Martinez', 'Dr. Jennifer White', 'Dr. James Brown'
];

const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'PayPal', 'Bank Transfer', 'Mobile Payment'];
const paymentStatuses = ['paid', 'pending', 'failed'];
const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const callStatuses = ['completed', 'missed', 'bounced', 'active'];
const callTypes = ['incoming', 'outgoing'];
const roles = ['admin', 'staff', 'agent', 'customer'];
const userStatuses = ['active', 'inactive', 'blocked'];

// Generate demo users
const generateUsers = async () => {
  const users = [];
  
  for (let i = 0; i < 25; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = userStatuses[Math.floor(Math.random() * userStatuses.length)];
    
    // Generate avatar URL (using UI Avatars service)
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${Math.floor(Math.random() * 16777215).toString(16)}&color=fff`;
    
    try {
      const user = await User.create({
        fullName,
        email,
        phone,
        role,
        status,
        avatar
      });
      users.push(user);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
      } else {
      }
    }
  }
  
  return users;
};

// Generate appointments for a specific user
const generateAppointmentsForUser = async (user, userIndex, appointmentCount, appointmentStartIndex) => {
  const appointments = [];
  
  for (let i = 0; i < appointmentCount; i++) {
    const patientName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const email = `${patientName.toLowerCase().replace(' ', '.')}${userIndex}${i}@example.com`;
    const service = services[Math.floor(Math.random() * services.length)];
    const date = randomDateThisMonth();
    const time = randomTime();
    const assignedAgent = agents[Math.floor(Math.random() * agents.length)];
    const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const id = `APT${String(appointmentStartIndex + i + 1).padStart(4, '0')}`;
    
    try {
      const appointment = await Appointment.create({
        id,
        patientName,
        phone,
        email,
        service,
        date,
        time,
        assignedAgent,
        status,
        paymentStatus,
        userId: user.id  // Link to user
      });
      appointments.push(appointment);
    } catch (error) {
    }
  }
  
  return appointments;
};

// Generate demo appointments with proper user relationships
const generateAppointments = async (users) => {
  const allAppointments = [];
  let appointmentCounter = 0;
  
  // Define appointments per user (varying numbers)
  const appointmentsPerUser = [3, 5, 2, 4, 6, 3, 5, 4, 2, 3, 5, 4, 3, 6, 2, 4, 5, 3, 4, 2, 5, 3, 4, 6, 3];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const appointmentCount = appointmentsPerUser[i] || 3; // Default to 3 if array is shorter
    
    const userAppointments = await generateAppointmentsForUser(user, i, appointmentCount, appointmentCounter);
    allAppointments.push(...userAppointments);
    appointmentCounter += appointmentCount;
  }
  
  return allAppointments;
};

// Generate payments for a specific user, linking to their appointments
const generatePaymentsForUser = async (user, userIndex, paymentCount, userAppointments, paymentStartIndex) => {
  const payments = [];
  
  for (let i = 0; i < paymentCount; i++) {
    // Link payment to user's appointment if available
    // Ensure payments are properly linked to appointments when appointments exist
    let appointment = null;
    if (userAppointments.length > 0) {
      // Distribute payments across appointments evenly
      // Each appointment should have at least one payment if possible
      const appointmentIndex = i % userAppointments.length;
      appointment = userAppointments[appointmentIndex];
    }
    
    const customerName = appointment ? appointment.patientName : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = (Math.random() * 500 + 50).toFixed(2);
    const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const date = randomDateThisMonth();
    const timestamp = randomDateTimeThisMonth();
    const service = appointment ? appointment.service : services[Math.floor(Math.random() * services.length)];
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}${i}`;
    const id = `PAY${String(paymentStartIndex + i + 1).padStart(4, '0')}`;
    
    try {
      const appointmentIdValue = appointment ? appointment.id : null;
      const payment = await Payment.create({
        id,
        transactionId,
        customerName,
        appointmentId: appointmentIdValue,  // Link to appointment
        paymentMethod,
        amount: parseFloat(amount),
        status,
        date,
        timestamp,
        service,
        userId: user.id  // Link to user
      });
      payments.push(payment);
      const appointmentLink = appointment ? ` (Appointment: ${appointment.id})` : '';
    } catch (error) {
    }
  }
  
  return payments;
};

// Generate demo payments with proper user and appointment relationships
const generatePayments = async (users, allAppointments) => {
  const allPayments = [];
  let paymentCounter = 0;
  
  // Group appointments by user
  const appointmentsByUser = {};
  allAppointments.forEach(apt => {
    if (!appointmentsByUser[apt.userId]) {
      appointmentsByUser[apt.userId] = [];
    }
    appointmentsByUser[apt.userId].push(apt);
  });
  
  // Define payments per user (varying numbers, usually 1-2 less than appointments)
  const paymentsPerUser = [2, 4, 1, 3, 5, 2, 4, 3, 1, 2, 4, 3, 2, 5, 1, 3, 4, 2, 3, 1, 4, 2, 3, 5, 2];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const paymentCount = paymentsPerUser[i] || 2; // Default to 2 if array is shorter
    const userAppointments = appointmentsByUser[user.id] || [];
    
    const userPayments = await generatePaymentsForUser(user, i, paymentCount, userAppointments, paymentCounter);
    allPayments.push(...userPayments);
    paymentCounter += paymentCount;
  }
  
  return allPayments;
};

// Generate calls for a specific user
const generateCallsForUser = async (user, userIndex, callCount, callStartIndex, isFirstBatch) => {
  const calls = [];
  
  // Determine number of active calls (3 or 4) - only for first batch
  const activeCallsCount = isFirstBatch ? (Math.random() > 0.5 ? 4 : 3) : 0;
  let activeCallsCreated = 0;
  
  for (let i = 0; i < callCount; i++) {
    const callerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const phoneNumber = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
    
    // Ensure we create 3-4 active calls in the first batch
    let status;
    if (isFirstBatch && activeCallsCreated < activeCallsCount) {
      status = 'active';
      activeCallsCreated++;
    } else {
      const nonActiveStatuses = ['completed', 'missed', 'bounced'];
      status = nonActiveStatuses[Math.floor(Math.random() * nonActiveStatuses.length)];
    }
    
    // For active calls, use current timestamp and no duration yet
    const isActive = status === 'active';
    const duration = isActive ? null : randomDuration();
    const timestamp = isActive ? new Date().toISOString() : randomDateTimeThisMonth();
    
    const purposes = [
      'Appointment booking', 'Consultation inquiry', 'Follow-up call', 'Emergency',
      'General inquiry', 'Payment inquiry', 'Service request', 'Complaint',
      'Feedback', 'Rescheduling'
    ];
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
    const notes = isActive 
      ? `Call in progress regarding ${purpose.toLowerCase()}.`
      : `Call regarding ${purpose.toLowerCase()}. ${status === 'completed' ? 'Successfully completed.' : 'Call was not completed.'}`;
    const id = `CALL${String(callStartIndex + i + 1).padStart(4, '0')}`;
    
    try {
      const call = await Call.create({
        id,
        callerName,
        phoneNumber,
        callType,
        status,
        duration,
        timestamp,
        purpose,
        notes,
        userId: user.id  // Link to user
      });
      calls.push(call);
      const statusDisplay = status === 'active' ? 'ACTIVE' : duration;
    } catch (error) {
    }
  }
  
  if (isFirstBatch && activeCallsCreated > 0) {
  }
  
  return calls;
};

// Generate demo calls with proper user relationships
const generateCalls = async (users) => {
  const allCalls = [];
  let callCounter = 0;
  
  // Define calls per user (varying numbers)
  const callsPerUser = [4, 6, 3, 5, 7, 4, 6, 5, 3, 4, 6, 5, 4, 7, 3, 5, 6, 4, 5, 3, 6, 4, 5, 7, 4];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const callCount = callsPerUser[i] || 4; // Default to 4 if array is shorter
    const isFirstBatch = i === 0; // Only create active calls for first user
    
    const userCalls = await generateCallsForUser(user, i, callCount, callCounter, isFirstBatch);
    allCalls.push(...userCalls);
    callCounter += callCount;
  }
  
  return allCalls;
};

// Main seed function
const seedDatabase = async () => {
  try {
    // Clear existing appointments and payments
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM appointments');
    
    // Fetch existing users (required for appointments and payments)
    const existingUsers = await User.findAll({ limit: 1 });
    if (existingUsers.length === 0) {
      process.exit(1);
    }
    const allUsers = await User.findAll({ limit: 1000 });
    
    // Generate only appointments and payments with existing users
    // Calls and users remain unchanged
    const appointments = await generateAppointments(allUsers);
    const payments = await generatePayments(allUsers, appointments);
    
    // Set totalappointments, totalpayments, and totalcalls to 0 for all users
    // Also ensure lastActivity is set (use created_at if null)
    await pool.query(`
      UPDATE users 
      SET 
        totalappointments = 0, 
        totalpayments = 0, 
        totalcalls = 0,
        lastActivity = COALESCE(lastActivity, created_at, CURRENT_TIMESTAMP)
    `);
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

// Run seed if called directly
seedDatabase();

export default seedDatabase;