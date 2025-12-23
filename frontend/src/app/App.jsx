import React from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNavigation } from "./components/TopNavigation";
import { MetricCard } from "./components/MetricCard";
import { AppointmentsTable } from "./components/AppointmentsTable";
import { LiveCallsPanel } from "./components/LiveCallsPanel";
import { PaymentStatus } from "./components/PaymentStatus";
import { AppointmentsChart } from "./components/AppointmentsChart";
import { ServiceDistributionChart } from "./components/ServiceDistributionChart";
import { CallsLog } from "./components/CallsLog";
import { Payments } from "./components/Payments";
import { Users } from "./components/Users";
import { Settings } from "./components/Settings";
import { ThemeProvider } from "./providers/ThemeProvider";
import { PhoneCall, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { appointmentsService } from "./services/appointmentsService";
import { paymentsService } from "./services/paymentsService";
import { callsService } from "./services/callsService";
import { usersService } from "./services/usersService";
import { calculateWeeklyData, calculateMonthlyData, calculateServiceDistribution } from "./utils/chartDataUtils";
import { toast, Toaster } from "sonner";

// Helper function to normalize date to YYYY-MM-DD format
const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') {
    // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const dateStr = dateValue.split('T')[0];
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
  }
  // Try to parse as Date object
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

function DashboardContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [shownAlerts, setShownAlerts] = useState(new Set());
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [liveCalls, setLiveCalls] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Generate alerts from data
  useEffect(() => {
    generateAlerts();
  }, [payments, callLogs]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all records for charts (using a very high limit to get all data)
      // For tables, we can still paginate, but charts need all data
      const [apptsRes, paymentsRes, callsRes, liveCallsRes, usersRes] = await Promise.all([
        appointmentsService.getAll({ limit: 10000 }),
        paymentsService.getAll({ limit: 10000 }),
        callsService.getAll({ limit: 10000 }),
        callsService.getLiveCalls(),
        usersService.getAll({ limit: 10000 }),
      ]);

      setAppointments(apptsRes.appointments || []);
      setPayments(paymentsRes.payments || []);
      setCallLogs(callsRes.calls || []);
      setLiveCalls(liveCallsRes || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load data. Using fallback data.");
      // Fallback to empty arrays if API fails
      setAppointments([]);
      setPayments([]);
      setCallLogs([]);
      setLiveCalls([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = () => {
    const newAlerts = [];
    
    // Check for missed calls
    const missedCalls = callLogs.filter(call => call.status === 'missed');
    missedCalls.forEach(call => {
      newAlerts.push({
        id: `ALERT_CALL_${call.id}`,
        type: 'critical',
        message: `Missed call from ${call.callerName} - ${call.purpose}`,
        timestamp: call.timestamp,
        category: 'missed-call',
      });
    });

    // Check for failed payments
    const failedPayments = payments.filter(p => p.status === 'failed');
    failedPayments.forEach(payment => {
      newAlerts.push({
        id: `ALERT_PAY_${payment.id}`,
        type: 'critical',
        message: `Payment failed for ${payment.appointmentId} - ${payment.customerName} ($${payment.amount})`,
        timestamp: payment.timestamp,
        category: 'failed-payment',
      });
    });

    setAlerts(newAlerts);
  };

  // Calculate metrics from database data
  const today = new Date().toISOString().split('T')[0];
  
  // Active Calls - count live calls from database
  const totalCalls = liveCalls.length;
  
  // Today's Appointments - filter by normalized date
  const todayAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.date);
    return aptDate === today;
  }).length;
  
  // Confirmed appointments for today
  const confirmedTodayAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.date);
    return aptDate === today && apt.status === "confirmed";
  }).length;
  
  // Completed Appointments - all completed appointments from database
  const completedAppointments = appointments.filter(
    apt => apt.status === "completed"
  ).length;
  
  // Pending Payments - count and calculate total amount
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const pendingPaymentsAmount = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  
  // Total Revenue - sum of all paid payments
  const totalRevenue = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  
  // Total Calls from database
  const totalCallsFromDB = callLogs.length;
  
  // Completed Calls from database
  const completedCalls = callLogs.filter(call => call.status === "completed").length;

  // Calculate chart data
  const weeklyData = calculateWeeklyData(appointments, callLogs);
  const monthlyData = calculateMonthlyData(appointments, callLogs);
  const serviceDistribution = calculateServiceDistribution(appointments);

  // Handle appointment status update
  const handleAppointmentStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await appointmentsService.update(appointmentId, { status: newStatus });
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      toast.success("Appointment status updated", {
        description: `Status changed to ${newStatus}`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("Failed to update appointment status");
      console.error(error);
    }
  };

  // Handle appointment created
  const handleAppointmentCreated = async (newAppointment) => {
    setAppointments([...appointments, newAppointment]);
    await fetchAllData(); // Refresh all data
  };

  // Handle payment created
  const handlePaymentCreated = async (newPayment) => {
    setPayments([...payments, newPayment]);
    await fetchAllData(); // Refresh all data
  };

  // Handle call created - only add if status is 'completed'
  const handleCallCreated = async (newCall) => {
    // Only add to callLogs if the transformed status is 'completed'
    if (newCall.status === 'completed') {
      setCallLogs([...callLogs, newCall]);
    }
    await fetchAllData(); // Refresh all data
  };

  // Show critical alert notifications
  useEffect(() => {
    const criticalAlerts = alerts.filter(alert => alert.type === "critical");
    
    criticalAlerts.forEach(alert => {
      if (!shownAlerts.has(alert.id)) {
        const isMissedCall = alert.category === "missed-call";
        const isFailedPayment = alert.category === "failed-payment";
        
        toast.error(alert.message, {
          duration: 8000,
          icon: isMissedCall ? "📞" : isFailedPayment ? "💳" : "⚠️",
          className: "border-2 border-red-500",
          position: "top-right",
        });
        
        setShownAlerts(prev => new Set([...prev, alert.id]));
      }
    });
  }, [alerts, shownAlerts]);

  const handleAlertClick = (alert) => {
    toast.info(`Viewing alert: ${alert.category}`, {
      description: alert.message,
      duration: 5000,
    });
  };

  // Render appointments section
  const renderAppointmentsSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your appointments. Update status as needed.
          </p>
        </div>

        {/* Appointments Chart */}
        <AppointmentsChart 
          weeklyData={weeklyData}
          monthlyData={monthlyData}
        />

        {/* Appointments Table */}
        <AppointmentsTable 
          appointments={appointments} 
          onStatusUpdate={handleAppointmentStatusUpdate}
        />
      </div>
    );
  };

  // Render calls section
  const renderCallsSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Calls</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            View all call logs, missed calls, and bounced calls. Track call history and timing.
          </p>
        </div>

        {/* Calls Log Component */}
        <CallsLog callLogs={callLogs} liveCalls={liveCalls} onCallCreated={handleCallCreated} />
      </div>
    );
  };

  // Render payments section
  const renderPaymentsSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage all payment transactions, track revenue, and handle refunds.
          </p>
        </div>

        {/* Payments Component */}
        <Payments payments={payments} appointments={appointments} onPaymentCreated={handlePaymentCreated} />
      </div>
    );
  };

  // Render users section
  const renderUsersSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage all users, roles, permissions, and account activity.
          </p>
        </div>

        {/* Users Component */}
        <Users 
          users={users} 
          appointments={appointments}
          payments={payments}
          callLogs={callLogs}
        />
      </div>
    );
  };

  // Render settings section
  const renderSettingsSection = () => {
    return <Settings />;
  };

  // Render dashboard section
  const renderDashboardSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your appointments today.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Active Calls"
            value={totalCalls}
            change={`${completedCalls} completed`}
            changeType="positive"
            icon={PhoneCall}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <MetricCard
            title="Today's Appointments"
            value={todayAppointments}
            change={`${confirmedTodayAppointments} confirmed`}
            changeType="neutral"
            icon={Calendar}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          />
          <MetricCard
            title="Pending Payments"
            value={`$${pendingPaymentsAmount.toFixed(2)}`}
            change={`${pendingPayments} transactions`}
            changeType="neutral"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <MetricCard
            title="Completed"
            value={completedAppointments}
            change={`${totalCallsFromDB} total calls`}
            changeType="positive"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <AppointmentsChart 
              weeklyData={weeklyData}
              monthlyData={monthlyData}
            />
          </div>
          <div>
            <ServiceDistributionChart data={serviceDistribution} />
          </div>
        </div>

        {/* Live Calls and Payment Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <LiveCallsPanel calls={liveCalls} />
          </div>
          <div>
            <PaymentStatus payments={payments} />
          </div>
        </div>

        {/* Appointments Table */}
        <AppointmentsTable 
          appointments={appointments} 
          onStatusUpdate={handleAppointmentStatusUpdate}
        />
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Hidden on mobile, shown via Sheet */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <TopNavigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          alerts={alerts}
          onAlertClick={handleAlertClick}
        />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeSection === "appointments" 
              ? renderAppointmentsSection() 
              : activeSection === "calls"
              ? renderCallsSection()
              : activeSection === "payments"
              ? renderPaymentsSection()
              : activeSection === "users"
              ? renderUsersSection()
              : activeSection === "settings"
              ? renderSettingsSection()
              : activeSection === "dashboard"
              ? renderDashboardSection()
              : (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white capitalize">
                      {activeSection}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      This section is coming soon.
                    </p>
                  </div>
                </div>
              )
            }
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}

