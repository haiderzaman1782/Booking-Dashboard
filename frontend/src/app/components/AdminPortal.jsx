import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  PhoneCall, 
  Upload,
  X,
  UserPlus,
  Plus,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { usersService } from "../services/usersService";
import { appointmentsService } from "../services/appointmentsService";
import { paymentsService } from "../services/paymentsService";
import { callsService } from "../services/callsService";
import { ImageCropper } from "./ImageCropper.jsx";

export function AdminPortal({ users, appointments, onRecordCreated, onLogout }) {
  const [activeTab, setActiveTab] = useState("users");
  const [allUsers, setAllUsers] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  
  // User form state
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'customer',
    status: 'active',
    avatar: null,
    avatarPreview: null,
  });
  const fileInputRef = React.useRef(null);
  
  // Image cropper state
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // Appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    assignedAgent: '',
    status: 'pending',
    userId: '',
  });

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    customerName: '',
    appointmentId: '',
    paymentMethod: 'Stripe',
    amount: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    service: '',
    userId: '',
  });

  // Call form state
  const [newCall, setNewCall] = useState({
    callerName: '',
    phoneNumber: '',
    callType: 'incoming',
    status: 'completed',
    duration: '00:00',
    timestamp: new Date().toISOString().slice(0, 16),
    purpose: '',
    notes: '',
    userId: '',
  });

  // Load users and appointments for dropdowns
  useEffect(() => {
    if (users && users.length > 0) {
      setAllUsers(users);
    }
    if (appointments && appointments.length > 0) {
      setAllAppointments(appointments);
    }
  }, [users, appointments]);

  // Helper function to extract numeric ID from transformed ID string
  const getNumericId = (id) => {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      if (id.startsWith('USR')) {
        const numPart = id.replace('USR', '');
        return parseInt(numPart) || id;
      }
      const parsed = parseInt(id);
      if (!isNaN(parsed)) return parsed;
    }
    return id;
  };

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Avatar file is too large. Maximum size is 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      
      // Open cropper dialog instead of directly setting
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCropComplete = (croppedFile) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    setNewUser({
      ...newUser,
      avatar: croppedFile,
      avatarPreview: previewUrl,
    });
    setImageToCrop(null);
    toast.success("Avatar cropped and ready");
  };

  // Handle create user
  const handleCreateUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const createdUser = await usersService.create({
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar || null,
      });
      
      if (onRecordCreated) {
        onRecordCreated('user', createdUser);
      }
      
      // Clean up preview URL
      if (newUser.avatarPreview && newUser.avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(newUser.avatarPreview);
      }
      
      setNewUser({ 
        fullName: '', 
        email: '', 
        phone: '', 
        role: 'customer', 
        status: 'active',
        avatar: null,
        avatarPreview: null,
      });
      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  // Handle create appointment
  const handleCreateAppointment = async () => {
    if (!newAppointment.patientName || !newAppointment.service || !newAppointment.date || !newAppointment.time) {
      toast.error("Please fill in required fields");
      return;
    }
    
    // Get userId from selected user
    let userId = null;
    if (newAppointment.userId) {
      const selectedUser = allUsers.find(u => {
        const userIdStr = typeof u.id === 'string' ? u.id : String(u.id);
        return userIdStr === newAppointment.userId || String(getNumericId(u.id)) === newAppointment.userId;
      });
      if (selectedUser) {
        userId = getNumericId(selectedUser.id);
      }
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
        userId: userId,
      });
      
      if (onRecordCreated) {
        onRecordCreated('appointment', created);
      }
      
      setNewAppointment({ 
        patientName: '', 
        phone: '', 
        email: '', 
        service: '', 
        date: '', 
        time: '', 
        assignedAgent: '', 
        status: 'pending',
        userId: '',
      });
      toast.success("Appointment created successfully");
    } catch (error) {
      toast.error("Failed to create appointment");
    }
  };

  // Handle create payment
  const handleCreatePayment = async () => {
    if (!newPayment.customerName || !newPayment.amount || !newPayment.paymentMethod) {
      toast.error("Please fill in required fields");
      return;
    }
    
    // Get userId from selected user
    let userId = null;
    if (newPayment.userId) {
      const selectedUser = allUsers.find(u => {
        const userIdStr = typeof u.id === 'string' ? u.id : String(u.id);
        return userIdStr === newPayment.userId || String(getNumericId(u.id)) === newPayment.userId;
      });
      if (selectedUser) {
        userId = getNumericId(selectedUser.id);
      }
    }
    
    try {
      const created = await paymentsService.create({
        customerName: newPayment.customerName,
        appointmentId: newPayment.appointmentId || null,
        paymentMethod: newPayment.paymentMethod,
        amount: parseFloat(newPayment.amount),
        status: newPayment.status,
        date: newPayment.date,
        service: newPayment.service,
        userId: userId,
      });
      
      if (onRecordCreated) {
        onRecordCreated('payment', created);
      }
      
      setNewPayment({ 
        customerName: '', 
        appointmentId: '', 
        paymentMethod: 'Stripe', 
        amount: '', 
        status: 'pending', 
        date: new Date().toISOString().split('T')[0], 
        service: '',
        userId: '',
      });
      toast.success("Payment created successfully");
    } catch (error) {
      toast.error("Failed to create payment");
    }
  };

  // Handle create call
  const handleCreateCall = async () => {
    if (!newCall.callerName || !newCall.phoneNumber) {
      toast.error("Please fill in required fields");
      return;
    }
    
    // Get userId from selected user
    let userId = null;
    if (newCall.userId) {
      const selectedUser = allUsers.find(u => {
        const userIdStr = typeof u.id === 'string' ? u.id : String(u.id);
        return userIdStr === newCall.userId || String(getNumericId(u.id)) === newCall.userId;
      });
      if (selectedUser) {
        userId = getNumericId(selectedUser.id);
      }
    }
    
    try {
      const created = await callsService.create({
        callerName: newCall.callerName,
        phoneNumber: newCall.phoneNumber,
        callType: newCall.callType,
        status: newCall.status,
        duration: newCall.duration,
        timestamp: newCall.timestamp,
        purpose: newCall.purpose,
        notes: newCall.notes,
        userId: userId,
      });
      
      if (onRecordCreated) {
        onRecordCreated('call', created);
      }
      
      setNewCall({ 
        callerName: '', 
        phoneNumber: '', 
        callType: 'incoming', 
        status: 'completed', 
        duration: '00:00', 
        timestamp: new Date().toISOString().slice(0, 16), 
        purpose: '', 
        notes: '',
        userId: '',
      });
      toast.success("Call log created successfully");
    } catch (error) {
      toast.error("Failed to create call log");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Create and manage all records. All records are linked relationally to maintain data integrity.
          </p>
        </div>
        {onLogout && (
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="gap-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 dark:bg-gray-900 dark:border-gray-700">
          <TabsTrigger value="users" className="dark:data-[state=active]:bg-gray-800">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="appointments" className="dark:data-[state=active]:bg-gray-800">
            <Calendar className="w-4 h-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="payments" className="dark:data-[state=active]:bg-gray-800">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="calls" className="dark:data-[state=active]:bg-gray-800">
            <PhoneCall className="w-4 h-4 mr-2" />
            Calls
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
            <CardHeader>
              <CardTitle className="dark:text-white">Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-4">
                <label className="text-sm font-medium dark:text-gray-300 mb-2">Profile Picture</label>
                <div className="relative">
                  {newUser.avatarPreview ? (
                    <div className="relative">
                      <img
                        src={newUser.avatarPreview}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newUser.avatarPreview && newUser.avatarPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(newUser.avatarPreview);
                          }
                          setNewUser({ ...newUser, avatar: null, avatarPreview: null });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {newUser.avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max 5MB, JPG/PNG
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Full Name *</label>
                  <Input
                    placeholder="Enter full name"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Email *</label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Role</label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
            <CardHeader>
              <CardTitle className="dark:text-white">Create New Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Patient Name *</label>
                  <Input
                    placeholder="Enter patient name"
                    value={newAppointment.patientName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Link to User (Optional)</label>
                  <Select value={newAppointment.userId || "none"} onValueChange={(value) => setNewAppointment({ ...newAppointment, userId: value === "none" ? "" : value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="none">None</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={String(getNumericId(user.id))}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Service *</label>
                  <Input
                    placeholder="Enter service name"
                    value={newAppointment.service}
                    onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Assigned Agent</label>
                  <Input
                    placeholder="Enter agent name"
                    value={newAppointment.assignedAgent}
                    onChange={(e) => setNewAppointment({ ...newAppointment, assignedAgent: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Date *</label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Time *</label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select value={newAppointment.status} onValueChange={(value) => setNewAppointment({ ...newAppointment, status: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateAppointment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Appointment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
            <CardHeader>
              <CardTitle className="dark:text-white">Create New Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Customer Name *</label>
                  <Input
                    placeholder="Enter customer name"
                    value={newPayment.customerName}
                    onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Link to User (Optional)</label>
                  <Select value={newPayment.userId || "none"} onValueChange={(value) => setNewPayment({ ...newPayment, userId: value === "none" ? "" : value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="none">None</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={String(getNumericId(user.id))}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Link to Appointment (Optional)</label>
                  <Select value={newPayment.appointmentId || "none"} onValueChange={(value) => setNewPayment({ ...newPayment, appointmentId: value === "none" ? "" : value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select appointment" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="none">None</SelectItem>
                      {allAppointments.map((apt) => (
                        <SelectItem key={apt.id} value={apt.id}>
                          {apt.patientName} - {apt.service} ({apt.date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Amount *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Payment Method *</label>
                  <Select value={newPayment.paymentMethod} onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="Stripe">Stripe</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Service</label>
                  <Input
                    placeholder="Enter service name"
                    value={newPayment.service}
                    onChange={(e) => setNewPayment({ ...newPayment, service: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Date</label>
                  <Input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select value={newPayment.status} onValueChange={(value) => setNewPayment({ ...newPayment, status: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreatePayment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Payment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
            <CardHeader>
              <CardTitle className="dark:text-white">Create New Call Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Caller Name *</label>
                  <Input
                    placeholder="Enter caller name"
                    value={newCall.callerName}
                    onChange={(e) => setNewCall({ ...newCall, callerName: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Link to User (Optional)</label>
                  <Select value={newCall.userId || "none"} onValueChange={(value) => setNewCall({ ...newCall, userId: value === "none" ? "" : value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="none">None</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={String(getNumericId(user.id))}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Phone Number *</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newCall.phoneNumber}
                    onChange={(e) => setNewCall({ ...newCall, phoneNumber: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Call Type</label>
                  <Select value={newCall.callType} onValueChange={(value) => setNewCall({ ...newCall, callType: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select value={newCall.status} onValueChange={(value) => setNewCall({ ...newCall, status: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Duration (MM:SS)</label>
                  <Input
                    placeholder="00:00"
                    value={newCall.duration}
                    onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={newCall.timestamp}
                    onChange={(e) => setNewCall({ ...newCall, timestamp: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium dark:text-gray-300">Purpose</label>
                  <Input
                    placeholder="Enter call purpose"
                    value={newCall.purpose}
                    onChange={(e) => setNewCall({ ...newCall, purpose: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium dark:text-gray-300">Notes</label>
                  <Input
                    placeholder="Enter notes (optional)"
                    value={newCall.notes}
                    onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <Button onClick={handleCreateCall} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Call Log
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Cropper Dialog */}
      <ImageCropper
        imageSrc={imageToCrop}
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          setImageToCrop(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
          }
        }}
        onCropComplete={handleCropComplete}
        aspect={1}
        cropShape="round"
      />
    </div>
  );
}

