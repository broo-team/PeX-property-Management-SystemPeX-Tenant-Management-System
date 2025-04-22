import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye, Trash2, Building2, Phone, Mail, MapPin } from "lucide-react";
import axiosInstance from "@/services/authService";
import { format } from "date-fns";
import Sidebar from "@/Pages/Sidebar";
import Navbar from "@/Pages/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getImageUrl } from '@/utils/imageUtils';
import { ImageTest } from '@/components/ImageTest';

interface Contact {
  _id: string;
  buildingName: string;
  buildingImage: string | null;
  propertyType: 'residential' | 'commercial' | 'mixed';
  fullName: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
  createdAt: string;
}

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const response = await axiosInstance.get("/api/contacts");
      console.log('Contacts response:', response.data);
      setContacts(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [propertyTypeFilter]);

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/contacts/${id}`);
      fetchContacts();
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case "residential":
        return "bg-emerald-100 text-emerald-800";
      case "commercial":
        return "bg-blue-100 text-blue-800";
      case "mixed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, imagePath: string) => {
    console.error('Image load error for path:', imagePath);
    console.log('Full image URL:', getImageUrl(imagePath));
    e.currentTarget.src = '/placeholder.jpg';
  };

  return (
    <div className="h-screen w-full">
      <Navbar />
      <div className="flex h-[calc(100vh-65px)]">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="p-8 overflow-auto bg-[#F7F7F7] min-h-full">
            <Card className="mt-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold text-emerald-700">
                      Contact Requests
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      Manage incoming contact requests
                    </CardDescription>
                  </div>
                  <Select
                    value={propertyTypeFilter}
                    onValueChange={setPropertyTypeFilter}
                  >
                    <SelectTrigger className="w-[180px] border-emerald-200">
                      <SelectValue placeholder="Filter by property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Property Type</TableHead>
                          <TableHead className="w-[250px]">Building</TableHead>
                          <TableHead className="w-[250px]">Contact</TableHead>
                          <TableHead className="w-[200px]">Address</TableHead>
                          <TableHead className="w-[150px]">Date</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact._id}>
                            <TableCell>
                              <Badge
                                className={`${getPropertyTypeColor(
                                  contact.propertyType
                                )} px-2 py-1 rounded-full text-xs font-semibold`}
                              >
                                {contact.propertyType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {contact.buildingName}
                              </div>
                              {contact.buildingImage && (
                                <ImageTest imagePath={contact.buildingImage} />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {contact.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {contact.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {contact.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {contact.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(contact.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setSelectedContact(contact)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(contact._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">
              Contact Details
            </DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="mt-4 space-y-6">
              {selectedContact.buildingImage && (
                <img
                  src={getImageUrl(selectedContact.buildingImage)}
                  alt={selectedContact.buildingName}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.jpg';
                  }}
                />
              )}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Building Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>{selectedContact.buildingName}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>{selectedContact.address}</span>
                    </div>
                    <Badge className={`${getPropertyTypeColor(selectedContact.propertyType)}`}>
                      {selectedContact.propertyType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-5 h-5 mr-2 text-emerald-600" />
                      <span>{selectedContact.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedContact.message && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Additional Message</h3>
                  <p className="text-gray-600">{selectedContact.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactList;