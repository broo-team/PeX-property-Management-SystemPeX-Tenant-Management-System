import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MaintenanceRequest {
  issueDescription: string;
  category: string;
}

interface MaintenanceResponse {
  id: number;
  tenant_id: number;
  stallCode: string;
  building_id: number;
  issueDescription: string;
  category: string;
  status: string;
  createdAt: string;
  tenantApproved: boolean; // Field to track tenant approval
  reason?: string;
}

interface CustomModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function CustomModal({ open, title, children, onClose }: CustomModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export function Maintenance() {
  const [newMaintenanceRequest, setNewMaintenanceRequest] = useState<MaintenanceRequest>({
    issueDescription: '',
    category: 'Other',
  });
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState({ maintenance: true });
  // New state for pending reason modal
  const [pendingReasonModalOpen, setPendingReasonModalOpen] = useState(false);
  const [selectedPendingReason, setSelectedPendingReason] = useState<string | undefined>(undefined);
  
  const { user } = useAuth();

  const getStatusColor = (status: string | undefined, tenantApproved: boolean) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (tenantApproved) return 'bg-purple-100 text-purple-800';
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'owner pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchMaintenanceRequests = async () => {
    setIsLoading({ maintenance: true });
    try {
      const response = await axiosInstance.get('/api/maintenance');
      setMaintenanceRequests(response.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch maintenance requests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ maintenance: false });
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.tenant || !user.building) {
      toast({
        title: 'Error',
        description: 'User data not available. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    const maintenancePayload = {
      tenant_id: user.tenant.id,
      stallCode: user.tenant.stallCode,
      building_id: user.building.id,
      issueDescription: newMaintenanceRequest.issueDescription,
      category: newMaintenanceRequest.category,
    };

    try {
      const response = await axiosInstance.post('/api/maintenance', maintenancePayload);
      toast({
        title: 'Success',
        description: 'Maintenance request submitted successfully.',
      });
      setMaintenanceRequests([response.data, ...maintenanceRequests]);
      setNewMaintenanceRequest({ issueDescription: '', category: 'Other' });
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit maintenance request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTenantApproval = async (requestId: number) => {
    try {
      const response = await axiosInstance.put(`/api/maintenance/${requestId}`, {
        type: 'tenantApprove',
      });
      const updatedRequest = response.data;
      toast({
        title: 'Success',
        description: 'Maintenance request approved successfully.',
      });
      setMaintenanceRequests(
        maintenanceRequests.map((request) =>
          request.id === requestId ? updatedRequest : request
        )
      );
    } catch (error) {
      console.error('Error approving maintenance request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve maintenance request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // New handler to open pending reason modal.
  const handleOpenPendingReason = (reason: string) => {
    setSelectedPendingReason(reason);
    setPendingReasonModalOpen(true);
  };

  const handleClosePendingReason = () => {
    setPendingReasonModalOpen(false);
    setSelectedPendingReason(undefined);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>Submit and view your maintenance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleMaintenanceSubmit}
            className="space-y-4 mb-6 bg-white p-6 rounded-lg border border-emerald-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="issueDescription" className="text-emerald-700">
                  Issue Description
                </Label>
                <Textarea
                  id="issueDescription"
                  value={newMaintenanceRequest.issueDescription}
                  onChange={(e) =>
                    setNewMaintenanceRequest({
                      ...newMaintenanceRequest,
                      issueDescription: e.target.value,
                    })
                  }
                  placeholder="Describe the issue..."
                  className="min-h-[100px] border-emerald-200 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-emerald-700">
                  Category
                </Label>
                <Select
                  value={newMaintenanceRequest.category}
                  onValueChange={(value) =>
                    setNewMaintenanceRequest({
                      ...newMaintenanceRequest,
                      category: value as any,
                    })
                  }
                >
                  <SelectTrigger className="border-emerald-200 focus:ring-emerald-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Electrical', 'Water', 'Infrastructure', 'HVAC', 'Other'].map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
            >
              Submit Request
            </Button>
          </form>

          {isLoading.maintenance ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : maintenanceRequests.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {maintenanceRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{request.category}</CardTitle>
                        <Badge
                          variant="outline"
                          className={getStatusColor(request.status, request.tenantApproved)}
                          onClick={() => {
                            // When Owner Pending status has a reason, open our custom modal.
                            if (
                              (request.status.toLowerCase() === 'owner pending' || request.status.toLowerCase() === 'pending') &&
                              request.reason
                            ) {
                              handleOpenPendingReason(request.reason);
                            }
                          }}
                        >
                          {request.tenantApproved ? 'Approved' : request.status}
                        </Badge>
                      </div>
                      <CardDescription>{formatDate(request.createdAt)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{request.issueDescription}</p>
                      {request.status === 'Resolved' && !request.tenantApproved && (
                        <Button
                        onClick={() => handleTenantApproval(request.id)}
                        style={{ backgroundColor: '#3835ff' }}
                        className="hover:brightness-90 text-white mt-4"
                      >
                        Approve Resolution
                      </Button>
                      
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Card>
                  <CardHeader>
                    <CardTitle>Tenant-Approved Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {maintenanceRequests
                      .filter((request) => request.tenantApproved)
                      .map((approvedRequest) => (
                        <div key={approvedRequest.id}>
                          <p>Category: {approvedRequest.category}</p>
                          <p>Description: {approvedRequest.issueDescription}</p>
                          <p>Status: {approvedRequest.status}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <p>No maintenance requests found.</p>
          )}
        </CardContent>
      </Card>
      {/* Custom Modal for Owner Pending Reason */}
      <CustomModal
        open={pendingReasonModalOpen}
        title="Owner Pending Reason"
        onClose={handleClosePendingReason}
      >
        <p>{selectedPendingReason}</p>
      </CustomModal>
    </>
  );
}
