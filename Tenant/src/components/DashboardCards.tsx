import { useEffect, useState } from "react";
import { DollarSign, PenToolIcon as Tool, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import moment from "moment";
import { toast } from "@/components/ui/use-toast";

interface LeasePayment {
  totalDue: number;
  createdAt: string;
}

interface UtilityBill {
  cost: number;
  current_reading: number;
  bill_date: string;
  utility_type: string;
}

interface MaintenanceRequest {
  status: string;
  category: string;
  createdAt: string;
}

export default function DashboardCards() {
  const { user } = useAuth();
  const [leasePayments, setLeasePayments] = useState<LeasePayment[]>([]);
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState({
    lease: true,
    utility: true,
    maintenance: true,
  });

  const fetchLeasePayments = async () => {
    if (!user) return;
    try {
      const [tenantRes, billRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tenants`),
        axios.get(`http://localhost:5000/api/rent`),
      ]);
      
      const tenants = tenantRes.data;
      const bills = billRes.data;
      const activeTenant = tenants.find(
        (tenant) => Number(tenant.terminated) === 0 && tenant.tenant_id === user.tenant?.tenant_id
      );

      if (activeTenant) {
        const tenantBill = bills.find((b) => b.tenant_id === user.tenant?.tenant_id);
        const payments = tenantBill ? [{
          totalDue: parseFloat(tenantBill.amount) + (parseFloat(tenantBill.penalty) || 0),
          createdAt: tenantBill.createdAt
        }] : [];
        setLeasePayments(payments);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lease payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, lease: false }));
    }
  };

  const fetchUtilityBills = async () => {
    if (!user?.tenant?.tenant_id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/utilities/tenant_utility_usage`);
      const electricityBills = response.data.filter(
        (bill) => bill.utility_type === 'electricity' && bill.tenant_id === user.tenant?.tenant_id
      );
      setUtilityBills(electricityBills);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch utility bills",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, utility: false }));
    }
  };

  const fetchMaintenanceRequests = async () => {
    if (!user?.tenant?.id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/maintenance`);
      const tenantRequests = response.data.filter(
        (request) => request.tenant_id === user.tenant?.id
      );
      setMaintenanceRequests(tenantRequests);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch maintenance requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, maintenance: false }));
    }
  };

  useEffect(() => {
    fetchLeasePayments();
    fetchUtilityBills();
    fetchMaintenanceRequests();
  }, [user]);

  const renderSkeleton = () => (
    <ul className="divide-y divide-emerald-100">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="px-4 py-3 hover:bg-emerald-50/50 transition-colors duration-150">
          <Skeleton className="h-10 w-full bg-emerald-200/50" />
        </li>
      ))}
    </ul>
  );

  const formatDate = (dateString: string) => {
    return moment(dateString).format("YYYY-MM-DD");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg hover:shadow-emerald-200 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50">Total Due</CardTitle>
            {/* <DollarSign className="h-5 w-5 text-emerald-100" /> */}
            <div style={{
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 24px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #ffd700, #ffa500)', // golden vibe
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '18px',
  fontFamily: '"Segoe UI", sans-serif',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  letterSpacing: '1px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  textTransform: 'uppercase',
  transition: 'transform 0.2s ease-in-out',
  cursor: 'default'
}}>
  <span style={{
    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
  }}>
    ETB
  </span>
</div>
          </CardHeader>
          <CardContent>
          <div className="flex items-baseline space-x-2 text-3xl font-bold text-white rounded-2xl">
  {isLoading.lease ? (
    <Skeleton className="h-8 w-24 bg-emerald-400/50" />
  ) : (() => {
    const formatted = formatCurrency(
      leasePayments.reduce((total, payment) => total + payment.totalDue, 0)
    );

    const [currency, ...amountParts] = formatted.split(" ");
    const amount = amountParts.join(" ");

    return (
      <>
        <span className="bg-gradient-to-r from-yellow-100 via-white to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
          {currency}
        </span>
        <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow text-3xl font-bold tracking-wide">
          {amount}
        </span>
      </>
    );
  })()}
</div>

          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-xl hover:shadow-emerald-300/60 transition-all duration-300 rounded-2xl">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-semibold text-white tracking-wide">Electricity Usage</CardTitle>
    <Zap className="h-5 w-5 text-yellow-100 drop-shadow-sm" />
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-extrabold text-white flex items-end gap-1">
      {isLoading.utility ? (
        <Skeleton className="h-8 w-24 bg-emerald-300/40 rounded-md" />
      ) : (
        <>
          <span className="bg-gradient-to-r from-yellow-100 via-white to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
            {utilityBills.reduce((total, bill) => {
              const previous = parseFloat(bill.previous_reading);
              const current = parseFloat(bill.current_reading);
              const kwhUsed = current - previous;
              return total + kwhUsed;
            }, 0).toFixed(2)} {/* Added .toFixed(2) to format to 2 decimal places */}
          </span>
          <span className="text-sm text-emerald-100 font-medium mb-1">kWh</span>
        </>
      )}
    </div>
  </CardContent>
</Card>

<Card className="bg-gradient-to-br from-emerald-300 to-emerald-400 shadow-xl hover:shadow-emerald-200/60 transition-all duration-300 rounded-2xl">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-semibold text-white tracking-wide">Pending Maintenance</CardTitle>
    <Tool className="h-5 w-5 text-white drop-shadow-sm" />
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-extrabold text-white flex items-center gap-2">
      {isLoading.maintenance ? (
        <Skeleton className="h-8 w-24 bg-emerald-300/50 rounded-md" />
      ) : (
        <>
          <span className="bg-gradient-to-r from-orange-100 via-white to-orange-300 bg-clip-text text-transparent drop-shadow-sm">
            {
              maintenanceRequests.filter(request => 
                ['pending', 'owner pending'].includes(request.status.toLowerCase())
              ).length
            }
          </span>
          <span className="text-sm text-white/80 font-medium">tasks</span>
        </>
      )}
    </div>
  </CardContent>
</Card>

      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-emerald-800 mb-4">Recent Activity</h2>
        <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-200">
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {isLoading.lease || isLoading.utility || isLoading.maintenance ? (
                renderSkeleton()
              ) : (
                <ul className="divide-y divide-emerald-100">
                  {[
                    ...leasePayments.map(p => ({ ...p, type: 'lease' })),
                    ...utilityBills.map(b => ({ ...b, type: 'utility' })),
                    ...maintenanceRequests.map(m => ({ ...m, type: 'maintenance' }))
                  ]
                    .sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf())
                    .slice(0, 5)
                    .map((item, index) => (
                      <li key={index} className="px-4 py-3 hover:bg-emerald-50/50 transition-colors duration-150">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {item.type === 'lease' ? (
                              <div className="p-2 rounded-full bg-emerald-100">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                              </div>
                            ) : item.type === 'utility' ? (
                              <div className="p-2 rounded-full bg-emerald-100">
                                <Zap className="h-5 w-5 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-full bg-emerald-100">
                                <Tool className="h-5 w-5 text-emerald-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-emerald-900 truncate">
                              {item.type === 'lease' ? 'Lease Payment' : 
                               item.type === 'utility' ? 'Electricity Bill' : 
                               'Maintenance Request'}
                            </p>
                            <p className="text-sm text-emerald-600 truncate">
  {item.type === 'lease' ? formatCurrency(item.totalDue) :
   item.type === 'utility' ? `${(parseFloat(item.current_reading) - parseFloat(item.previous_reading)).toFixed(2)} kWh` : // Corrected line
   item.category}
</p>
                          </div>
                          <div className="flex-shrink-0 text-sm text-emerald-500">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}