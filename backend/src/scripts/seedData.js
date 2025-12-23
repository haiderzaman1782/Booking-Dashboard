import pool from '../config/database.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Call } from '../models/Call.js';

// Helper function to generate random dates
const randomDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

const randomDateTime = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
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
const callStatuses = ['completed', 'missed', 'bounced'];
const callTypes = ['incoming', 'outgoing'];
const roles = ['admin', 'staff', 'agent', 'customer'];
const userStatuses = ['active', 'inactive', 'blocked'];

// Generate demo users
const generateUsers = async () => {
  console.log('Generating users...');
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
      console.log(`Created user: ${fullName} (ID: ${user.id})`);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`User ${email} already exists, skipping...`);
      } else {
        console.error(`Error creating user ${email}:`, error.message);
      }
    }
  }
  
  return users;
};

// Generate demo appointments
const generateAppointments = async (users) => {
  console.log('Generating appointments...');
  const appointments = [];
  
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const patientName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const email = `${patientName.toLowerCase().replace(' ', '.')}${i}@example.com`;
    const service = services[Math.floor(Math.random() * services.length)];
    const date = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
    const time = randomTime();
    const assignedAgent = agents[Math.floor(Math.random() * agents.length)];
    const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const id = `APT${String(i + 1).padStart(4, '0')}`;
    
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
        userId: user.id
      });
      appointments.push(appointment);
      console.log(`Created appointment: ${id} - ${patientName}`);
    } catch (error) {
      console.error(`Error creating appointment ${id}:`, error.message);
    }
  }
  
  return appointments;
};

// Generate demo payments
const generatePayments = async (users, appointments) => {
  console.log('Generating payments...');
  const payments = [];
  
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const appointment = appointments.length > 0 ? appointments[Math.floor(Math.random() * appointments.length)] : null;
    const customerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = (Math.random() * 500 + 50).toFixed(2);
    const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const date = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
    const timestamp = randomDateTime(new Date(2024, 0, 1), new Date());
    const service = services[Math.floor(Math.random() * services.length)];
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const id = `PAY${String(i + 1).padStart(4, '0')}`;
    
    try {
      const payment = await Payment.create({
        id,
        transactionId,
        customerName,
        appointmentId: appointment ? appointment.id : null,
        paymentMethod,
        amount: parseFloat(amount),
        status,
        date,
        timestamp,
        service,
        userId: user.id
      });
      payments.push(payment);
      console.log(`Created payment: ${id} - ${customerName} - $${amount}`);
    } catch (error) {
      console.error(`Error creating payment ${id}:`, error.message);
    }
  }
  
  return payments;
};

// Generate demo calls
const generateCalls = async (users) => {
  console.log('Generating calls...');
  const calls = [];
  
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const callerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const phoneNumber = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
    const status = callStatuses[Math.floor(Math.random() * callStatuses.length)];
    const duration = randomDuration();
    const timestamp = randomDateTime(new Date(2024, 0, 1), new Date());
    const purposes = [
      'Appointment booking', 'Consultation inquiry', 'Follow-up call', 'Emergency',
      'General inquiry', 'Payment inquiry', 'Service request', 'Complaint',
      'Feedback', 'Rescheduling'
    ];
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
    const notes = `Call regarding ${purpose.toLowerCase()}. ${status === 'completed' ? 'Successfully completed.' : 'Call was not completed.'}`;
    const id = `CALL${String(i + 1).padStart(4, '0')}`;
    
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
        userId: user.id
      });
      calls.push(call);
      console.log(`Created call: ${id} - ${callerName} - ${duration}`);
    } catch (error) {
      console.error(`Error creating call ${id}:`, error.message);
    }
  }
  
  return calls;
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...\n');
    
    // Check if users already exist
    const existingUsers = await User.findAll({ limit: 1 });
    if (existingUsers.length > 0) {
      console.log('Users already exist. Fetching existing users...');
      const allUsers = await User.findAll({ limit: 1000 });
      
      // Generate appointments, payments, and calls with existing users
      const appointments = await generateAppointments(allUsers);
      const payments = await generatePayments(allUsers, appointments);
      const calls = await generateCalls(allUsers);
      
      console.log('\n✅ Seeding completed!');
      console.log(`- Users: ${allUsers.length} (existing)`);
      console.log(`- Appointments: ${appointments.length}`);
      console.log(`- Payments: ${payments.length}`);
      console.log(`- Calls: ${calls.length}`);
    } else {
      // Generate all data
      const users = await generateUsers();
      const appointments = await generateAppointments(users);
      const payments = await generatePayments(users, appointments);
      const calls = await generateCalls(users);
      
      console.log('\n✅ Seeding completed!');
      console.log(`- Users: ${users.length}`);
      console.log(`- Appointments: ${appointments.length}`);
      console.log(`- Payments: ${payments.length}`);
      console.log(`- Calls: ${calls.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if called directly
seedDatabase();

export default seedDatabase;

