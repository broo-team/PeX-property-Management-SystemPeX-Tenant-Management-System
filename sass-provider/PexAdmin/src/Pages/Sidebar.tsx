import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Bell,
  LogOut,
  Settings,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/dashboard",
      description: "Overview and analytics"
    },
    { 
      icon: Building2, 
      label: "Properties", 
      path: "/properties",
      description: "Manage buildings and units"
    },
    { 
      icon: Users, 
      label: "Tenants", 
      path: "/tenants",
      description: "Tenant management"
    },
    { 
      icon: FileText, 
      label: "Documents", 
      path: "/documents",
      description: "Contracts and files"
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      path: "/notifications",
      description: "Updates and alerts"
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/settings",
      description: "System preferences"
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <TooltipProvider>
      <div className="fixed left-0 h-screen w-64 bg-white border-r border-emerald-100 flex flex-col">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Tooltip key={item.path} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                        : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-emerald-600")} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-emerald-600 text-white">
                  {item.description}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-emerald-100">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
