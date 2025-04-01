// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import {MaintenanceForm} from '@/components/ui/MaintenanceForm'; // Import the external MaintenanceForm component
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Badge } from '@/components/ui/badge';
// import { toast } from '@/components/ui/use-toast';
// import axiosInstance from '@/services/authService';
// import { useAuth } from '@/contexts/AuthContext';
// import { TabsContent } from '@/components/ui/tabs';
// import { Skeleton } from './skeleton';

// interface MaintenanceRequest {
//   description: string;
//   category: string;
// }

// interface MaintenanceRequestWithIds extends MaintenanceRequest {
//   tenant_id: number;
//   stallCode: string;
//   building_id: number;
// }

// interface MaintenanceResponse {
//   _id: string;
//   category: string;
//   description: string;
//   status: string;
//   createdAt: string;
// }

// export function Maintenance() {
//   const [newMaintenanceRequest, setNewMaintenanceRequest] = useState<MaintenanceRequest>({
//     description: '',
//     category: 'Other',
//   });
//   const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceResponse[]>([]);
//   const [isLoading, setIsLoading] = useState({ maintenance: true });
//   const { user } = useAuth();

//   const getStatusColor = (status: string | undefined) => {
//     if (!status) return 'bg-gray-100 text-gray-800';

//     switch (status.toLowerCase()) {
//       case 'paid':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'overdue':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const renderSkeleton = () => (
//     <div className="space-y-4">
//       {[...Array(3)].map((_, index) => (
//         <Skeleton key={index} className="h-12 w-full" />
//       ))}
//     </div>
//   );

//   const fetchMaintenanceRequests = async () => {
//     setIsLoading({ maintenance: true });
//     try {
//       const response = await axiosInstance.get('/api/maintenances');
//       setMaintenanceRequests(response.data);
//     } catch (error) {
//       console.error('Error fetching maintenance requests:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to fetch maintenance requests. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading({ maintenance: false });
//     }
//   };

//   useEffect(() => {
//     fetchMaintenanceRequests();
//   }, []);

//   const handleMaintenanceSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !user.tenant || !user.building) {
//       toast({
//         title: 'Error',
//         description: 'User data not available. Please login again.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     const maintenanceRequestWithIds: MaintenanceRequestWithIds = {
//       ...newMaintenanceRequest,
//       tenant_id: user.tenant.id,
//       stallCode: user.tenant.stallCode,
//       building_id: user.building.id,
//     };

//     try {
//       await axiosInstance.post('/api/maintenances/createMaintenance', maintenanceRequestWithIds);
//       toast({
//         title: 'Success',
//         description: 'Maintenance request submitted successfully.',
//       });
//       setNewMaintenanceRequest({ description: '', category: 'Other' });
//       fetchMaintenanceRequests();
//     } catch (error) {
//       console.error('Error submitting maintenance request:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to submit maintenance request. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   return (
//     <TabsContent value="maintenance">
//       <Card>
//         <CardHeader>
//           <CardTitle>Maintenance Requests</CardTitle>
//           <CardDescription>Submit and view your maintenance requests</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <MaintenanceForm
//             onSubmit={handleMaintenanceSubmit}
//             description={newMaintenanceRequest.description}
//             category={newMaintenanceRequest.category}
//             onDescriptionChange={(value) =>
//               setNewMaintenanceRequest({ ...newMaintenanceRequest, description: value })
//             }
//             onCategoryChange={(value) =>
//               setNewMaintenanceRequest({ ...newMaintenanceRequest, category: value })
//             }
//           />

//           {isLoading.maintenance ? (
//             renderSkeleton()
//           ) : maintenanceRequests.length > 0 ? (
//             <ScrollArea className="h-[300px]">
//               <div className="space-y-4">
//                 {maintenanceRequests.map((request) => (
//                   <Card key={request._id}>
//                     <CardHeader>
//                       <div className="flex justify-between items-center">
//                         <CardTitle className="text-lg">{request.category}</CardTitle>
//                         <Badge variant="outline" className={getStatusColor(request.status)}>
//                           {request.status}
//                         </Badge>
//                       </div>
//                       <CardDescription>{formatDate(request.createdAt)}</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <p>{request.description}</p>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </ScrollArea>
//           ) : (
//             <p>No maintenance requests found.</p>
//           )}
//         </CardContent>
//       </Card>
//     </TabsContent>
//   );
// }
