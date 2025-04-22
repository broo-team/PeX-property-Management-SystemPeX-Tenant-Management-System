"use client";

import React, { useMemo, useState, useEffect } from "react";
import Navbar from "../Pages/Navbar";
import Sidebar from "../Pages/Sidebar";
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Building,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import axiosInstance from "../services/authService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

// Define our interfaces for activity logs and property insights
interface ActivityLog {
  type: string;
  text: string;
  time: string;
  status: "success" | "warning";
  icon: string;
}

interface PropertyInsights {
  occupancyRate: number;
  propertyTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  totalProperties: number;
  activeProperties: number;
}

const Dashboard = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [insights, setInsights] = useState<PropertyInsights | null>(null);

  // Constant for pie chart label calculations
  const RADIAN = Math.PI / 180;

  // Combined fetch for buildings, logs, and insights
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/api/buildings");
        // Assuming your API responds with a "buildings" array
        const fetchedBuildings = response.data.buildings;
        setBuildings(fetchedBuildings);

        // Simulate a simple activity log
        setActivityLogs([
          {
            type: "fetch",
            text: `Fetched ${fetchedBuildings.length} building(s) successfully.`,
            time: new Date().toISOString(),
            status: "success",
            icon: "Building",
          },
        ]);

        // Compute property insights based on the fetched buildings
        const totalProperties = fetchedBuildings.length;
        const activeProperties = fetchedBuildings.filter(
          (b: any) => b.suspended === 0
        ).length;
        const occupancyRate = totalProperties
          ? Math.round((activeProperties / totalProperties) * 100)
          : 0;

        // Compute property types distribution, for example by "property_type"
        const propertyTypesMap: Record<string, number> = {};
        fetchedBuildings.forEach((b: any) => {
          const type = b.property_type;
          propertyTypesMap[type] = (propertyTypesMap[type] || 0) + 1;
        });
        const propertyTypes = Object.entries(propertyTypesMap).map(
          ([type, count]) => ({
            type,
            count,
            percentage: Number(((count / totalProperties) * 100).toFixed(1)),
          })
        );

        setInsights({
          occupancyRate,
          propertyTypes,
          totalProperties,
          activeProperties,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to display relative time for activity logs
  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Define stats cards data. Note: we're computing total owners as unique owner emails.
  const stats = [
    {
      title: "Total Properties",
      value: buildings.length,
      icon: Building2,
      trend: 12,
      color: "blue",
    },
    {
      title: "Total Owners",
      value: new Set(buildings.map((b: any) => b.owner_email)).size,
      icon: Users,
      trend: 8,
      color: "green",
    },
    {
      title: "Active Properties",
      value: buildings.filter((b: any) => b.suspended === 0).length,
      icon: Activity,
      trend: 5,
      color: "emerald",
    },
    {
      title: "Pending Approvals",
      value: buildings.filter((b: any) => b.suspended !== 0).length,
      icon: AlertCircle,
      trend: -3,
      color: "yellow",
    },
  ];

  // Compute data for the Pie Chart – splitting into Active and Pending based on the "suspended" flag.
  const statusData = useMemo(() => {
    if (buildings.length === 0) return [];
    const active = buildings.filter((b: any) => b.suspended === 0).length;
    const pending = buildings.filter((b: any) => b.suspended !== 0).length;
    const total = active + pending;

    return [
      {
        name: "Active",
        value: active,
        percentage: ((active / total) * 100).toFixed(1),
        color: "#10B981", // green
      },
      {
        name: "Pending",
        value: pending,
        percentage: ((pending / total) * 100).toFixed(1),
        color: "#F59E0B", // yellow
      },
    ];
  }, [buildings]);

  // Custom label renderer for the Pie Chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // Example growth data for the line chart (could be replaced with real-time analytics)
  const growthData = [
    { month: "Jan", properties: 4 },
    { month: "Feb", properties: 6 },
    { month: "Mar", properties: 8 },
    { month: "Apr", properties: 10 },
    { month: "May", properties: 12 },
    { month: "Jun", properties: 15 },
  ];

  // A helper function to map log icon names to actual icon components
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Building: Building2,
      Users: Users,
      Activity: Activity,
      AlertCircle: AlertCircle,
      CheckCircle: CheckCircle2,
    };
    return icons[iconName] || Building2;
  };

  // Enhanced Pie Chart component
  const PropertyStatusChart = ({ data }: { data: any[] }) => {
    return (
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} (${data.find((item) => item.name === name)?.percentage}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name} ({entry.value} - {entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                        {stat.value}
                      </h3>
                    </div>
                    <div
                      className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
                    >
                      <stat.icon
                        className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        stat.trend > 0 ? "text-green-500" : "text-red-500"
                      } mr-1`}
                    />
                    <span className={stat.trend > 0 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(stat.trend)}%
                    </span>
                    <span className="ml-2 text-gray-500">vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Line Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Property Growth
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="properties"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Property Status Distribution
                </h3>
                <PropertyStatusChart data={statusData} />
              </div>
            </div>

            {/* Activity and Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>
                    Latest property management activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLogs.map((log, index) => {
                      const IconComponent = getIcon(log.icon);
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${
                              log.status === "success"
                                ? "bg-green-100 text-green-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium dark:text-white">
                              {log.text}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(log.time)}
                            </p>
                          </div>
                          <Badge variant={log.status === "success" ? "default" : "warning"}>
                            {log.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Property Insights Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Insights</CardTitle>
                  <CardDescription>Key metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Occupancy Rate */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Occupancy Rate</p>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {insights?.occupancyRate}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {insights?.activeProperties} of {insights?.totalProperties} properties active
                      </p>
                    </div>

                    {/* Property Types Distribution */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Property Types</h4>
                      <div className="space-y-3">
                        {insights?.propertyTypes.map((type, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{type.type}</span>
                              <span className="font-medium">{type.count} properties</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${type.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
