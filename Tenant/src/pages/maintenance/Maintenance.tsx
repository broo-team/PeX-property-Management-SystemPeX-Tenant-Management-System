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
}

export function Maintenance() {
  const [newMaintenanceRequest, setNewMaintenanceRequest] = useState<MaintenanceRequest>({
    issueDescription: '',
    category: 'Other',
  });
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState({ maintenance: true });
  const { user } = useAuth(); // Fetch logged-in user's data

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );

  const fetchMaintenanceRequests = async () => {
    setIsLoading({ maintenance: true });
    try {
      const response = await axiosInstance.get('/api/maintenance'); // Get all requests for the tenant
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

    // Ensure user data is available
    if (!user || !user.tenant || !user.building) {
      toast({
        title: 'Error',
        description: 'User data not available. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    // Construct request payload
    const maintenancePayload = {
      tenant_id: user.tenant.id,
      stallCode: user.tenant.stallCode,
      building_id: user.building.id,
      issueDescription: newMaintenanceRequest.issueDescription,
      category: newMaintenanceRequest.category,
    };

    try {
      // API request to create a maintenance request
      const response = await axiosInstance.post('/api/maintenance', maintenancePayload);

      // Success feedback
      toast({
        title: 'Success',
        description: 'Maintenance request submitted successfully.',
      });

      // Update maintenanceRequests state with the new request
      setMaintenanceRequests([response.data, ...maintenanceRequests]);

      // Clear the form
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
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
          renderSkeleton()
        ) : maintenanceRequests.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {maintenanceRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{request.category}</CardTitle>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <CardDescription>{formatDate(request.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{request.issueDescription}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p>No maintenance requests found.</p>
        )}
      </CardContent>
    </Card>
  );
}
