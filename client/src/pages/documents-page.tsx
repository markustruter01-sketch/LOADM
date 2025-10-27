import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, ArrowLeft, FileText, Eye, Download, Briefcase } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import PdfModal from "@/components/PdfModal";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  description: string;
}

interface DirectoryEntry {
  id: number;
  airbaseCode: string;
  airbaseName: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

interface PdfDocument {
  filename: string;
  title: string;
  description: string;
  category: string;
  lastModified: string;
  size: string;
}

interface Mission {
  id: number;
  missionName: string;
  aircraftCallSign: string;
  captainName: string;
  departureLocation: string;
  arrivalDestination: string;
  loadmaster1Name: string;
  loadmaster2Name: string;
  hasDangerousGoods: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [expandedAirfields, setExpandedAirfields] = useState<Set<number>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAddingContact, setIsAddingContact] = useState<number | null>(null);
  const [newEntryData, setNewEntryData] = useState({
    airbaseCode: "",
    airbaseName: "",
  });
  const [newContactData, setNewContactData] = useState({
    name: "",
    phoneNumber: "",
    description: "",
  });
  
  // PDF Modal state
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfDocument | null>(null);

  // Mission management state
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [selectedMissions, setSelectedMissions] = useState<Set<number>>(new Set());
  const [newMissionData, setNewMissionData] = useState({
    missionName: "",
    aircraftCallSign: "",
    captainName: "",
    departureLocation: "",
    arrivalDestination: "",
    loadmaster1Name: "",
    loadmaster2Name: "",
    hasDangerousGoods: false,
  });

  // Available PDF documents
  const pdfDocuments: PdfDocument[] = [
    {
      filename: "DG Checklist.pdf",
      title: "Dangerous Goods Checklist",
      description: "Comprehensive checklist for non-radioactive dangerous goods shipments with verification procedures",
      category: "Operational Procedures",
      lastModified: "2024-06-04",
      size: "86 KB"
    },
    {
      filename: "Passenger and Cargo Manifest.pdf",
      title: "Passenger/Crew and Cargo Manifest",
      description: "Official form for listing all personnel and cargo in transport operations",
      category: "Forms",
      lastModified: "2024-06-04",
      size: "145 KB"
    },
    {
      filename: "DG Shipper Declaration.pdf",
      title: "Dangerous Goods Shipper Declaration",
      description: "Official shipper declaration form for dangerous goods transport compliance and documentation",
      category: "Forms",
      lastModified: "2024-06-07",
      size: "219 KB"
    },
    {
      filename: "Vehicles Load Card.pdf",
      title: "Vehicle Load Card",
      description: "DA Form 7598 for documenting vehicle cargo loading, weight distribution, and load planning specifications",
      category: "Load Planning",
      lastModified: "2024-06-07",
      size: "124 KB"
    }
  ];

  const queryClient = useQueryClient();

  // Handle PDF modal opening
  const handleViewPdf = (pdf: PdfDocument) => {
    setSelectedPdf(pdf);
    setPdfModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdf(null);
  };

  const {
    data: directories = [],
    isLoading: directoryLoading,
    error: directoryError,
  } = useQuery({
    queryKey: ["/api/phone-directory"],
  });

  const createDirectoryMutation = useMutation({
    mutationFn: async (data: { airbaseCode: string; airbaseName: string }) => {
      return await apiRequest("/api/phone-directory", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setIsAddingNew(false);
      setNewEntryData({ airbaseCode: "", airbaseName: "" });
    },
  });

  const updateDirectoryMutation = useMutation({
    mutationFn: async (data: DirectoryEntry) => {
      return await apiRequest(`/api/phone-directory/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setEditingEntry(null);
    },
  });

  const deleteDirectoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/phone-directory/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
    },
  });

  // Missions queries and mutations
  const {
    data: missions = [],
    isLoading: missionsLoading,
  } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  const createMissionMutation = useMutation({
    mutationFn: async (data: typeof newMissionData) => {
      console.log("Creating mission with data:", data);
      const response = await apiRequest("/api/missions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      console.log("Mission created successfully:", response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      toast({
        title: "Mission Created",
        description: "Your mission has been created successfully.",
      });
      setIsCreatingMission(false);
      setNewMissionData({
        missionName: "",
        aircraftCallSign: "",
        captainName: "",
        departureLocation: "",
        arrivalDestination: "",
        loadmaster1Name: "",
        loadmaster2Name: "",
        hasDangerousGoods: false,
      });
    },
    onError: (error: any) => {
      console.error("Failed to create mission:", error);
      toast({
        title: "Error Creating Mission",
        description: error.message || "Failed to create mission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMissionsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => 
        apiRequest(`/api/missions/${id}`, { method: "DELETE" })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      setSelectedMissions(new Set());
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async ({ entryId, contact }: { entryId: number; contact: Contact }) => {
      const entry = (directories as DirectoryEntry[]).find(d => d.id === entryId);
      if (!entry) throw new Error("Directory entry not found");
      
      const updatedEntry = {
        ...entry,
        contacts: [...entry.contacts, contact],
      };
      
      await apiRequest(`/api/phone-directory/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedEntry),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setIsAddingContact(null);
      setNewContactData({ name: "", phoneNumber: "", description: "" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ entryId, contact }: { entryId: number; contact: Contact }) => {
      const entry = (directories as DirectoryEntry[]).find(d => d.id === entryId);
      if (!entry) throw new Error("Directory entry not found");
      
      const updatedEntry = {
        ...entry,
        contacts: entry.contacts.map((c: Contact) => 
          c.id === contact.id ? contact : c
        ),
      };
      
      await apiRequest(`/api/phone-directory/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedEntry),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setEditingContact(null);
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async ({ entryId, contactId }: { entryId: number; contactId: string }) => {
      const entry = (directories as DirectoryEntry[]).find(d => d.id === entryId);
      if (!entry) throw new Error("Directory entry not found");
      
      const updatedEntry = {
        ...entry,
        contacts: entry.contacts.filter((contact: Contact) => contact.id !== contactId),
      };
      
      await apiRequest(`/api/phone-directory/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedEntry),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
    },
  });

  const handleToggleExpanded = (entryId: number) => {
    const newExpanded = new Set(expandedAirfields);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedAirfields(newExpanded);
  };

  const handleAddContact = (entryId: number) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactData.name,
      phoneNumber: newContactData.phoneNumber,
      description: newContactData.description,
    };
    
    addContactMutation.mutate({ entryId, contact: newContact });
  };

  const handleUpdateContact = (entryId: number, contact: Contact) => {
    updateContactMutation.mutate({ entryId, contact });
  };

  const handleDeleteContact = (entryId: number, contactId: string) => {
    deleteContactMutation.mutate({ entryId, contactId });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Documents - LOADMworkflow</title>
        <meta name="description" content="Access PDF documents and phone directory for airbase contact information" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Access PDF documents and contact information
          </p>
        </div>

        <Tabs defaultValue="pdfs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdfs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Documents
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Mission Documents
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Directory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdfs" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">PDF Documents</h2>
                  <p className="text-muted-foreground">Training materials, forms, and operational procedures</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pdfDocuments.map((doc) => (
                  <Card key={doc.filename} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <FileText className="h-8 w-8 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {doc.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {doc.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>Size: {doc.size}</span>
                        <span>Modified: {doc.lastModified}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          size="sm"
                          onClick={() => handleViewPdf(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/pdfs/${doc.filename}`;
                            link.download = doc.filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="missions" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Mission Documents</h2>
                  <p className="text-muted-foreground">Mission-specific documents and operational briefings</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsCreatingMission(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Mission
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedMissions.size === 0) return;
                    deleteMissionsMutation.mutate(Array.from(selectedMissions));
                  }}
                  disabled={selectedMissions.size === 0 || deleteMissionsMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedMissions.size})
                </Button>
              </div>

              {/* Missions Table */}
              {missionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No missions created</h3>
                  <p className="text-muted-foreground mb-4">Create your first mission to get started</p>
                  <Button onClick={() => setIsCreatingMission(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Mission
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedMissions.size === missions.length && missions.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMissions(new Set(missions.map(m => m.id)));
                              } else {
                                setSelectedMissions(new Set());
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mission Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Aircraft</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Captain</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Route</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Loadmasters</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">DG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missions.map((mission) => (
                        <tr key={mission.id} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedMissions.has(mission.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedMissions);
                                if (e.target.checked) {
                                  newSelected.add(mission.id);
                                } else {
                                  newSelected.delete(mission.id);
                                }
                                setSelectedMissions(newSelected);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{mission.missionName}</td>
                          <td className="px-4 py-3">{mission.aircraftCallSign}</td>
                          <td className="px-4 py-3">{mission.captainName}</td>
                          <td className="px-4 py-3 text-sm">
                            {mission.departureLocation} → {mission.arrivalDestination}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {mission.loadmaster1Name}
                            {mission.loadmaster2Name && `, ${mission.loadmaster2Name}`}
                          </td>
                          <td className="px-4 py-3">
                            {mission.hasDangerousGoods ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="directory" className="mt-6">
            <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Phone Directory</h2>
                <p className="text-muted-foreground">Airbase contact information organized by location codes</p>
              </div>
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Airbase
              </Button>
            </div>

            {directoryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : directoryError ? (
              <div className="text-center py-12">
                <p className="text-red-500">Error loading phone directory</p>
              </div>
            ) : (directories as DirectoryEntry[]).length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No airbases found</h3>
                <p className="text-muted-foreground mb-4">Add your first airbase directory to get started</p>
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Airbase
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(directories as DirectoryEntry[]).map((entry) => {
                  const isExpanded = expandedAirfields.has(entry.id);
                  return (
                    <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader 
                        className="pb-3 cursor-pointer"
                        onClick={() => handleToggleExpanded(entry.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1 h-6 w-6 flex items-center justify-center">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                              <CardTitle className="text-lg">
                                {entry.airbaseCode} - {entry.airbaseName}
                              </CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.contacts.length} contact{entry.contacts.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingEntry(entry)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDirectoryMutation.mutate(entry.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Contacts</h4>
                              <Button
                                size="sm"
                                onClick={() => setIsAddingContact(entry.id)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Contact
                              </Button>
                            </div>
                            
                            {entry.contacts.length === 0 ? (
                              <p className="text-muted-foreground text-sm">No contacts available</p>
                            ) : (
                              <div className="space-y-2">
                                {entry.contacts.map((contact: Contact) => (
                                  <div
                                    key={contact.id}
                                    className="flex justify-between items-start p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{contact.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {contact.phoneNumber}
                                      </div>
                                      {contact.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {contact.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingContact(contact)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteContact(entry.id, contact.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isAddingContact === entry.id && (
                              <div className="border rounded-lg p-4 bg-background">
                                <h5 className="font-medium mb-3">Add New Contact</h5>
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="contact-name">Name</Label>
                                    <Input
                                      id="contact-name"
                                      value={newContactData.name}
                                      onChange={(e) =>
                                        setNewContactData(prev => ({ ...prev, name: e.target.value }))
                                      }
                                      placeholder="Contact name"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="contact-phone">Phone Number</Label>
                                    <Input
                                      id="contact-phone"
                                      value={newContactData.phoneNumber}
                                      onChange={(e) =>
                                        setNewContactData(prev => ({ ...prev, phoneNumber: e.target.value }))
                                      }
                                      placeholder="Phone number"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="contact-description">Description</Label>
                                    <Input
                                      id="contact-description"
                                      value={newContactData.description}
                                      onChange={(e) =>
                                        setNewContactData(prev => ({ ...prev, description: e.target.value }))
                                      }
                                      placeholder="Role or department"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleAddContact(entry.id)}
                                      disabled={!newContactData.name || !newContactData.phoneNumber}
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Contact
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsAddingContact(null);
                                        setNewContactData({ name: "", phoneNumber: "", description: "" });
                                      }}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Airbase Directory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="airbase-code">Airbase Code</Label>
                    <Input
                      id="airbase-code"
                      value={newEntryData.airbaseCode}
                      onChange={(e) =>
                        setNewEntryData(prev => ({ ...prev, airbaseCode: e.target.value }))
                      }
                      placeholder="e.g., RAAF"
                    />
                  </div>
                  <div>
                    <Label htmlFor="airbase-name">Airbase Name</Label>
                    <Input
                      id="airbase-name"
                      value={newEntryData.airbaseName}
                      onChange={(e) =>
                        setNewEntryData(prev => ({ ...prev, airbaseName: e.target.value }))
                      }
                      placeholder="e.g., RAAF Base Amberley"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewEntryData({ airbaseCode: "", airbaseName: "" });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createDirectoryMutation.mutate(newEntryData)}
                      disabled={!newEntryData.airbaseCode || !newEntryData.airbaseName}
                    >
                      Add Airbase
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={editingEntry !== null} onOpenChange={() => setEditingEntry(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Airbase Directory</DialogTitle>
                </DialogHeader>
                {editingEntry && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-airbase-code">Airbase Code</Label>
                      <Input
                        id="edit-airbase-code"
                        value={editingEntry.airbaseCode}
                        onChange={(e) =>
                          setEditingEntry(prev => prev ? ({ ...prev, airbaseCode: e.target.value }) : null)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-airbase-name">Airbase Name</Label>
                      <Input
                        id="edit-airbase-name"
                        value={editingEntry.airbaseName}
                        onChange={(e) =>
                          setEditingEntry(prev => prev ? ({ ...prev, airbaseName: e.target.value }) : null)
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingEntry(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => updateDirectoryMutation.mutate(editingEntry)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={editingContact !== null} onOpenChange={() => setEditingContact(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Contact</DialogTitle>
                </DialogHeader>
                {editingContact && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-contact-name">Name</Label>
                      <Input
                        id="edit-contact-name"
                        value={editingContact.name}
                        onChange={(e) =>
                          setEditingContact(prev => prev ? ({ ...prev, name: e.target.value }) : null)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-contact-phone">Phone Number</Label>
                      <Input
                        id="edit-contact-phone"
                        value={editingContact.phoneNumber}
                        onChange={(e) =>
                          setEditingContact(prev => prev ? ({ ...prev, phoneNumber: e.target.value }) : null)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-contact-description">Description</Label>
                      <Input
                        id="edit-contact-description"
                        value={editingContact.description}
                        onChange={(e) =>
                          setEditingContact(prev => prev ? ({ ...prev, description: e.target.value }) : null)
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingContact(null)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          const entryId = (directories as DirectoryEntry[]).find(d => 
                            d.contacts.some((c: Contact) => c.id === editingContact.id)
                          )?.id;
                          if (entryId) {
                            handleUpdateContact(entryId, editingContact);
                          }
                        }}
                      >
                        {updateContactMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Modal */}
      {selectedPdf && (
        <PdfModal
          isOpen={pdfModalOpen}
          onClose={handleClosePdfModal}
          filename={selectedPdf.filename}
          title={selectedPdf.title}
        />
      )}

      {/* Create Mission Dialog */}
      <Dialog open={isCreatingMission} onOpenChange={setIsCreatingMission}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Mission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mission-name">Mission Name *</Label>
              <Input
                id="mission-name"
                data-testid="input-mission-name"
                value={newMissionData.missionName}
                onChange={(e) =>
                  setNewMissionData(prev => ({ ...prev, missionName: e.target.value }))
                }
                placeholder="e.g., Operation Phoenix Flight"
              />
            </div>

            <div>
              <Label htmlFor="aircraft-callsign">Aircraft Call Sign *</Label>
              <Input
                id="aircraft-callsign"
                data-testid="input-aircraft-callsign"
                value={newMissionData.aircraftCallSign}
                onChange={(e) =>
                  setNewMissionData(prev => ({ ...prev, aircraftCallSign: e.target.value }))
                }
                placeholder="e.g., RAAF C-17A A41-210"
              />
            </div>

            <div>
              <Label htmlFor="captain-name">Captain Name *</Label>
              <Input
                id="captain-name"
                data-testid="input-captain-name"
                value={newMissionData.captainName}
                onChange={(e) =>
                  setNewMissionData(prev => ({ ...prev, captainName: e.target.value }))
                }
                placeholder="e.g., SQNLDR John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departure-location">Departure Location *</Label>
                <Input
                  id="departure-location"
                  data-testid="input-departure-location"
                  value={newMissionData.departureLocation}
                  onChange={(e) =>
                    setNewMissionData(prev => ({ ...prev, departureLocation: e.target.value }))
                  }
                  placeholder="e.g., RAAF Base Amberley"
                />
              </div>

              <div>
                <Label htmlFor="arrival-destination">Arrival Destination *</Label>
                <Input
                  id="arrival-destination"
                  data-testid="input-arrival-destination"
                  value={newMissionData.arrivalDestination}
                  onChange={(e) =>
                    setNewMissionData(prev => ({ ...prev, arrivalDestination: e.target.value }))
                  }
                  placeholder="e.g., RAAF Base Darwin"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loadmaster1-name">Loadmaster 1 *</Label>
                <Input
                  id="loadmaster1-name"
                  data-testid="input-loadmaster1-name"
                  value={newMissionData.loadmaster1Name}
                  onChange={(e) =>
                    setNewMissionData(prev => ({ ...prev, loadmaster1Name: e.target.value }))
                  }
                  placeholder="e.g., SGT Jane Doe"
                />
              </div>

              <div>
                <Label htmlFor="loadmaster2-name">Loadmaster 2</Label>
                <Input
                  id="loadmaster2-name"
                  data-testid="input-loadmaster2-name"
                  value={newMissionData.loadmaster2Name}
                  onChange={(e) =>
                    setNewMissionData(prev => ({ ...prev, loadmaster2Name: e.target.value }))
                  }
                  placeholder="e.g., CPL Mike Johnson (optional)"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dangerous-goods"
                data-testid="checkbox-dangerous-goods"
                checked={newMissionData.hasDangerousGoods}
                onChange={(e) =>
                  setNewMissionData(prev => ({ ...prev, hasDangerousGoods: e.target.checked }))
                }
                className="rounded"
              />
              <Label htmlFor="dangerous-goods" className="cursor-pointer">
                Contains Dangerous Goods
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingMission(false);
                  setNewMissionData({
                    missionName: "",
                    aircraftCallSign: "",
                    captainName: "",
                    departureLocation: "",
                    arrivalDestination: "",
                    loadmaster1Name: "",
                    loadmaster2Name: "",
                    hasDangerousGoods: false,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                data-testid="button-create-mission"
                onClick={() => createMissionMutation.mutate(newMissionData)}
                disabled={
                  !newMissionData.missionName ||
                  !newMissionData.aircraftCallSign ||
                  !newMissionData.captainName ||
                  !newMissionData.departureLocation ||
                  !newMissionData.arrivalDestination ||
                  !newMissionData.loadmaster1Name ||
                  createMissionMutation.isPending
                }
              >
                {createMissionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Mission
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}