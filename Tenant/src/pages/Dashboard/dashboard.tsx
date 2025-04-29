import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Settings,
  Menu,
  Home,
  FileText,
  PenToolIcon as Tool,
  Book,
  DollarSign,
  Zap,
  Plus,
  MessageCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Profile from "../account/profile";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { addDays } from "date-fns";
import "react-day-picker/dist/style.css";
import { Maintenance } from "../maintenance/Maintenance";
import LeasePayments from "../RentAndLease/LeasePayments";
import Utility from "../Utility/Utility";
import Header from "@/components/Header";
import DashboardCards from "@/components/DashboardCards";
import RulesCard from "@/components/RulesCard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);

  // When the component mounts, check the URL for a payment parameter.
  // This covers both types:
  //   ?payment_status=success  (for lease payments) or ?payment=success (for utility payments)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment_status") || params.get("payment");
    if (status === "success") {
      setIsPaymentSuccessOpen(true);
    }
  }, []);

  // Sidebar JSX
  const renderSidebar = () => (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-emerald-100">
      <div className="p-4 border-b border-emerald-100">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-8 rounded-lg flex items-center justify-center">
            <img src="/ex.png" alt="logo" className="h-full w-full" />
          </div>
          <h2 className="text-xl font-light bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent ml-0 mt-2">
            Pex Property
          </h2>
        </div>
      </div>
      <nav className="flex-1 p-4">
        {[
          { name: "Overview", icon: Home },
          { name: "Lease", icon: DollarSign },
          { name: "Electricity", icon: Zap },
          { name: "Maintenance", icon: Tool },
          { name: "Rules", icon: Book },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name.toLowerCase()}
            onClick={() => setActiveTab(name.toLowerCase())}
            className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
              activeTab === name.toLowerCase()
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-emerald-50/30 relative">
      {/* Floating Action Button for Quick Actions */}
      
      {/* Quick Actions Menu */}
      
      <div className="flex h-full">
        {renderSidebar()}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="hidden md:inline-flex bg-emerald-50/50 p-1 rounded-lg border border-emerald-100 mb-6">
                  {["Overview", "Lease", "Electricity", "Maintenance", "Rules"].map(
                    (tab) => (
                      <TabsTrigger
                        key={tab.toLowerCase()}
                        value={tab.toLowerCase()}
                        className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
                      >
                        {tab}
                      </TabsTrigger>
                    )
                  )}
                </TabsList>
                <TabsContent value="overview">
                  <DashboardCards />
                </TabsContent>
                <TabsContent value="lease">
                  <LeasePayments />
                </TabsContent>
                <TabsContent value="electricity">
                  <Utility />
                </TabsContent>
                <TabsContent value="maintenance">
                  <Maintenance />
                </TabsContent>
                <TabsContent value="rules">
                  <RulesCard />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              View and edit your profile information
            </DialogDescription>
          </DialogHeader>
          <Profile />
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog
        open={isPaymentSuccessOpen}
        onOpenChange={setIsPaymentSuccessOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Successful</DialogTitle>
            <DialogDescription>
              Your payment has been successfully processed.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setIsPaymentSuccessOpen(false)}>Okay</Button>
        </DialogContent>
      </Dialog>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-90 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-4">
            {["Overview", "Lease", "Electricity", "Maintenance", "Rules"].map(
              (item) => (
                <Button
                  key={item.toLowerCase()}
                  variant={activeTab === item.toLowerCase() ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.toLowerCase());
                    setIsSidebarOpen(false);
                  }}
                >
                  {item === "Overview" && <Home className="mr-2 h-5 w-5" />}
                  {item === "Lease" && <DollarSign className="mr-2 h-5 w-5" />}
                  {item === "Electricity" && <Zap className="mr-2 h-5 w-5" />}
                  {item === "Maintenance" && <Tool className="mr-2 h-5 w-5" />}
                  {item === "Rules" && <Book className="mr-2 h-5 w-5" />}
                  {item}
                </Button>
              )
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
