import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, ArrowLeft, FileText, Eye, Download } from "lucide-react";
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

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
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

  // Available PDF documents
  const pdfDocuments: PdfDocument[] = [
    {
      filename: "25229.pdf",
      title: "Load Planning Manual",
      description: "Comprehensive guide for aircraft load planning procedures and calculations",
      category: "Training Materials",
      lastModified: "2024-05-15",
      size: "145 KB"
    },
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
      filename: "D.G.-Acceptance-ChecklistDry-2018-729x1024.jpg",
      title: "Dangerous Goods Acceptance Checklist",
      description: "Standard checklist for dangerous goods acceptance procedures",
      category: "Operational Procedures",
      lastModified: "2024-03-20",
      size: "892 KB"
    },
    {
      filename: "DD-Form-2130-13-C-17-load-plan-w-cargo-pallet-positions-39.png",
      title: "C-17 Load Plan Template",
      description: "Official DD Form 2130 for C-17 cargo pallet positioning",
      category: "Forms",
      lastModified: "2024-04-10",
      size: "2.1 MB"
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdfs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Documents
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
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleExpanded(entry.id)}
                                className="p-1 h-6 w-6"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              <CardTitle className="text-lg">
                                {entry.airbaseCode} - {entry.airbaseName}
                              </CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.contacts.length} contact{entry.contacts.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
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
    </div>
  );
}