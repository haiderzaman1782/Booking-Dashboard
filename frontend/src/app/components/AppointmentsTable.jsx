import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { Phone, Search, ListFilter, CheckSquare, Square } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { ExportDropdown } from "./ExportDropdown.jsx";
import { ExportConfigModal } from "./ExportConfigModal.jsx";
import { exportToCSV, exportToPDF, formatDateForExport, formatDateTimeForExport } from "../utils/exportUtils.js";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Plus, Calendar, Clock } from "lucide-react";
import { appointmentsService } from "../services/appointmentsService";

const statusColors = {
  confirmed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  completed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export function AppointmentsTable({ appointments, onStatusUpdate, onAppointmentCreated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all"); // "all", "filtered", "selected"
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    assignedAgent: '',
    status: 'pending',
  });

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (appointmentId, newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(appointmentId, newStatus);
    }
  };

  // Handle create appointment
  const handleCreateAppointment = async () => {
    if (!newAppointment.patientName || !newAppointment.service || !newAppointment.date || !newAppointment.time) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const created = await appointmentsService.create({
        patientName: newAppointment.patientName,
        phone: newAppointment.phone,
        email: newAppointment.email,
        service: newAppointment.service,
        date: newAppointment.date,
        time: newAppointment.time,
        assignedAgent: newAppointment.assignedAgent,
        status: newAppointment.status,
      });
      if (onAppointmentCreated) {
        onAppointmentCreated(created);
      }
      setIsCreateDialogOpen(false);
      setNewAppointment({ patientName: '', phone: '', email: '', service: '', date: '', time: '', assignedAgent: '', status: 'pending' });
      toast.success("Appointment created successfully");
    } catch (error) {
      toast.error("Failed to create appointment");
      console.error(error);
    }
  };

  // Handle row selection
  const handleSelectRow = (appointmentId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredAppointments.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAppointments.map(apt => apt.id)));
    }
  };

  // Get data to export based on scope
  const getExportData = () => {
    let dataToExport = [];
    if (exportScope === "selected") {
      dataToExport = filteredAppointments.filter(apt => selectedRows.has(apt.id));
    } else if (exportScope === "filtered") {
      dataToExport = filteredAppointments;
    } else {
      dataToExport = appointments;
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    { key: "id", label: "Appointment ID" },
    { key: "patientName", label: "Customer Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "service", label: "Service Name" },
    { key: "date", label: "Appointment Date" },
    { key: "time", label: "Appointment Time" },
    { key: "assignedAgent", label: "Assigned Agent" },
    { key: "status", label: "Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "createdDate", label: "Created Date" },
  ];

  // Handle export
  const handleExport = async (format) => {
    setSelectedFormat(format);
    setExportScope(
      selectedRows.size > 0 ? "selected" : 
      (searchQuery || statusFilter !== "all") ? "filtered" : "all"
    );
    setShowExportModal(true);
  };

  const handleExportConfirm = async (config) => {
    setIsExporting(true);
    try {
      const dataToExport = getExportData();
      
      // Filter by date range if provided
      let filteredData = dataToExport;
      if (config.startDate || config.endDate) {
        filteredData = dataToExport.filter(apt => {
          const aptDate = new Date(apt.date);
          if (config.startDate && aptDate < new Date(config.startDate)) return false;
          if (config.endDate && aptDate > new Date(config.endDate)) return false;
          return true;
        });
      }

      // Filter columns
      const selectedColumns = exportColumns.filter(col => config.columns.includes(col.key));
      
      // Prepare data with formatted values
      const formattedData = filteredData.map(apt => {
        const row = {};
        selectedColumns.forEach(col => {
          switch (col.key) {
            case "date":
              row[col.key] = formatDateForExport(apt.date);
              break;
            case "createdDate":
              row[col.key] = apt.createdAt ? formatDateForExport(apt.createdAt) : "N/A";
              break;
            case "email":
              row[col.key] = apt.email || "N/A";
              break;
            case "assignedAgent":
              row[col.key] = apt.assignedAgent || "N/A";
              break;
            case "paymentStatus":
              row[col.key] = apt.paymentStatus || "N/A";
              break;
            case "status":
              row[col.key] = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
              break;
            default:
              row[col.key] = apt[col.key] || "N/A";
          }
        });
        return row;
      });

      if (config.format === "csv") {
        exportToCSV(formattedData, selectedColumns, "appointments");
        toast.success("Appointments exported successfully!", {
          description: `${formattedData.length} records exported as CSV`,
        });
      } else if (config.format === "pdf") {
        const summaryData = config.includeSummary ? {
          "Total Appointments": formattedData.length,
          "Confirmed": formattedData.filter(d => d.status === "Confirmed").length,
          "Pending": formattedData.filter(d => d.status === "Pending").length,
          "Completed": formattedData.filter(d => d.status === "Completed").length,
          "Cancelled": formattedData.filter(d => d.status === "Cancelled").length,
        } : null;

        exportToPDF(
          formattedData,
          selectedColumns,
          {
            filename: "appointments",
            title: "Appointments Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Appointments exported successfully!", {
          description: `${formattedData.length} records exported as PDF`,
        });
      }

      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: error.message || "An error occurred while exporting data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Recent Appointments</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 dark:bg-gray-700 dark:hover:bg-gray-600">
                <Plus className="w-4 h-4" />
                Add Appointment
              </Button>
              <ExportDropdown
                onExport={handleExport}
                disabled={filteredAppointments.length === 0}
                isLoading={isExporting}
                exportScope={exportScope}
                hasSelectedRows={selectedRows.size > 0}
                hasFilters={searchQuery || statusFilter !== "all"}
              />
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by patient name, service, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredAppointments.length && filteredAppointments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">ID</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Patient Name</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Date</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Time</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Service</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="dark:border-gray-700">
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(appointment.id)}
                        onCheckedChange={() => handleSelectRow(appointment.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">{appointment.id}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.patientName}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.time}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.service}</TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(newStatus) => handleStatusChange(appointment.id, newStatus)}
                      >
                        <SelectTrigger className={`w-[140px] h-8 text-xs border ${statusColors[appointment.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Export Configuration Modal */}
      <ExportConfigModal
        key={`export-modal-${selectedFormat}-${showExportModal}`}
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onConfirm={handleExportConfirm}
        columns={exportColumns}
        defaultFormat={selectedFormat}
        showDateRange={true}
        showColumnSelection={true}
        showSummaryOption={true}
      />
    </Card>
  );
}

