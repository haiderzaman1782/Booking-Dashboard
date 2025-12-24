import { Bell, Search, Menu, LayoutDashboard, Calendar, PhoneCall, CreditCard, Users, Settings, Shield, CircleX, TriangleAlert, Clock } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.jsx";
import { cn } from "./ui/utils.js";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "calls", label: "Calls", icon: PhoneCall },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "users", label: "Users", icon: Users },
  { id: "admin", label: "Admin Portal", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

const alertConfig = {
  critical: {
    icon: CircleX,
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    badgeColor: "bg-red-500 text-white",
    iconColor: "text-red-600 dark:text-red-400"
  },
  warning: {
    icon: TriangleAlert,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    badgeColor: "bg-yellow-500 text-white",
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  info: {
    icon: Clock,
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    badgeColor: "bg-blue-500 text-white",
    iconColor: "text-blue-600 dark:text-blue-400"
  }
};

export function TopNavigation({ activeSection = "dashboard", onSectionChange = () => {}, alerts = [], onAlertClick = () => {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const criticalCount = alerts.filter(a => a.type === "critical").length;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-end gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu for the booking dashboard
            </SheetDescription>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">AI Booking</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Voice System</p>
                </div>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-md"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Bar */}
        <div className="flex-1 lg:px-0 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search appointments..."
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <button 
                type="button"
                className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 h-9 w-9 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {criticalCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse pointer-events-none"
                  >
                    {criticalCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 dark:bg-gray-800 dark:border-gray-700" align="end">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse text-xs">
                      {criticalCount} Critical
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {alerts.map((alert) => {
                      const config = alertConfig[alert.type];
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={alert.id}
                          onClick={() => {
                            onAlertClick(alert);
                            setNotificationsOpen(false);
                          }}
                          className={cn(
                            "p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                            config.bgColor,
                            config.borderColor,
                            alert.type === "critical" && "animate-pulse-subtle"
                          )}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              config.bgColor
                            )}>
                              <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", config.iconColor)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                                <Badge className={cn(config.badgeColor, "text-xs w-fit")}>
                                  {alert.category.replace("-", " ").toUpperCase()}
                                </Badge>
                                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                  {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                              <p className={cn("text-xs sm:text-sm font-medium mt-2 break-words", config.textColor)}>
                                {alert.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dr. Sarah Wilson</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            <Avatar>
              <AvatarImage className="w-10 h-10 rounded-full" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}

