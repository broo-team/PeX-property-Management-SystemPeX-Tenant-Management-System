import { useState} from "react";
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
  DialogTitle
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [showQuickActions, setShowQuickActions] = useState(false);


  const renderSidebar = () => (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-emerald-100">
      <div className="p-4 border-b border-emerald-100">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-8 rounded-lg  flex items-center justify-center">
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

      {/* Add user info at bottom of sidebar */}
      
    </aside>
  );
      <Card className="bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600">
          <CardTitle className="text-white flex items-center justify-between">
            <span>Payment Overview</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-emerald-600"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>View Full Report</DropdownMenuItem>
                <DropdownMenuItem>Export Data</DropdownMenuItem>
                <DropdownMenuItem>Set Alerts</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Lease Payment</span>
                  <span className="text-sm text-emerald-600">80%</span>
                </div>
                <Progress value={80} className="h-2 bg-emerald-100" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Electricity Bill</span>
                  <span className="text-sm text-emerald-600">65%</span>
                </div>
                <Progress value={65} className="h-2 bg-emerald-100" />
              </div>
            </div>

            {/* Payment Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-700">$2,450</p>
                <p className="text-xs text-emerald-500">
                  +12.5% from last month
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600">Upcoming</p>
                <p className="text-2xl font-bold text-emerald-700">$850</p>
                <p className="text-xs text-emerald-500">Due in 7 days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="col-span-2">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription className="text-emerald-100">
                Frequently used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    title: "Schedule Payment",
                    description: "Set up your next payment",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "Report Issue",
                    icon: AlertCircle,
                    description: "Submit maintenance request",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "View Documents",
                    icon: FileText,
                    description: "Access your lease agreement",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "Contact Support",
                    icon: MessageCircle,
                    description: "Get help with your queries",
                    color: "bg-emerald-400",
                  },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-lg bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200"
                  >
                    {/* <action.icon className="h-6 w-6 mb-2" /> */}
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-emerald-100">
                      {action.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar Widget - Updated */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Calendar</CardTitle>
            <CardDescription>Track your payment dates</CardDescription>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md p-3"
              classNames={{
                day_selected: "bg-emerald-600 text-white",
                day_today: "bg-emerald-100",
                day: "rounded-md hover:bg-emerald-50",
              }}
              modifiers={{
                payment: [addDays(new Date(), 7), addDays(new Date(), 15)],
              }}
              modifiersStyles={{
                payment: {
                  border: "2px solid #059669",
                  borderRadius: "50%",
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
        onClick={() => setShowQuickActions(!showQuickActions)}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 right-6 bg-white rounded-lg shadow-xl p-4 w-64"
          >
            <div className="space-y-2">
              {[
                { icon: DollarSign, label: "Make Payment" },
                { icon: FileText, label: "View Statement" },
                { icon: MessageCircle, label: "Contact Support" },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-2 w-full p-2 hover:bg-emerald-50 rounded-lg"
                >
                  <item.icon className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>;
  return (
    <div className="min-h-screen bg-emerald-50/30">
      <div className="flex h-full">
        {renderSidebar()}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header/>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="hidden md:inline-flex bg-emerald-50/50 p-1 rounded-lg border border-emerald-100 mb-6">
                  {[
                    "Overview",
                    "Lease",
                    "Electricity",
                    "Maintenance",
                    "Rules",
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.toLowerCase()}
                      value={tab.toLowerCase()}
                      className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
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
                  variant={
                    activeTab === item.toLowerCase() ? "secondary" : "ghost"
                  }
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
