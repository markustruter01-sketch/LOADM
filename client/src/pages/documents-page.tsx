import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X, FileText, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

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

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Documents state
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Phone Directory state
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedAirfields, setExpandedAirfields] = useState<Set<number>>(new Set());
  const [newEntry, setNewEntry] = useState({
    airbaseCode: "",
    airbaseName: "",
    contacts: [] as Contact[]
  });

  // Helper function to toggle airfield expansion
  const toggleAirfieldExpansion = (id: number) => {
    const newExpanded = new Set(expandedAirfields);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAirfields(newExpanded);
  };

  const { data: directories = [], isLoading: directoryLoading, error: directoryError } = useQuery<DirectoryEntry[]>({
    queryKey: ["/api/phone-directory"],
    select: (data: any[]) => {
      console.log("Phone directory raw data:", data);
      return data.map(entry => ({
        ...entry,
        contacts: typeof entry.contacts === 'string' ? JSON.parse(entry.contacts) : entry.contacts
      }));
    }
  });

  console.log("Phone directory directories:", directories);
  console.log("Phone directory loading:", directoryLoading);
  console.log("Phone directory error:", directoryError);

  const createMutation = useMutation({
    mutationFn: (data: typeof newEntry) => apiRequest("/api/phone-directory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setIsAddingNew(false);
      setNewEntry({ airbaseCode: "", airbaseName: "", contacts: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; entry: Omit<DirectoryEntry, 'id' | 'createdAt' | 'updatedAt'> }) =>
      apiRequest(`/api/phone-directory/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.entry),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/phone-directory/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
    },
  });

  const addContact = (entryData: typeof newEntry | DirectoryEntry, setData: any) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: "",
      phoneNumber: "",
      description: ""
    };
    setData((prev: any) => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
  };

  const updateContact = (entryData: typeof newEntry | DirectoryEntry, setData: any, contactId: string, field: keyof Contact, value: string) => {
    setData((prev: any) => ({
      ...prev,
      contacts: prev.contacts.map((contact: Contact) =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeContact = (entryData: typeof newEntry | DirectoryEntry, setData: any, contactId: string) => {
    setData((prev: any) => ({
      ...prev,
      contacts: prev.contacts.filter((contact: Contact) => contact.id !== contactId)
    }));
  };

  const handleSaveNew = () => {
    if (newEntry.airbaseCode && newEntry.airbaseName) {
      createMutation.mutate(newEntry);
    }
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        entry: {
          airbaseCode: editingEntry.airbaseCode,
          airbaseName: editingEntry.airbaseName,
          contacts: editingEntry.contacts
        }
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Documents & Directory - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Browse document templates and manage airbase phone directory for loadmaster operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Home
            </Button>
          </div>
          
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Documents & Directory</h1>
            <p className="text-muted-foreground mt-2">
              Access document templates and airbase contact information
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Directory
              </TabsTrigger>
            </TabsList>
            
            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentCard
                  document={{
                    id: 1,
                    title: "Load Planning Form",
                    description: "Complete detailed load planning documentation for cargo aircraft operations.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
                
                <DocumentCard
                  document={{
                    id: 2,
                    title: "Passenger/Crew and Cargo Manifest",
                    description: "Generate and complete detailed cargo manifests for all shipments.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
                
                <DocumentCard
                  document={{
                    id: 3,
                    title: "Dangerous Goods Declaration",
                    description: "Complete DG documentation for hazardous materials transportation.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
                
                <DocumentCard
                  document={{
                    id: 4,
                    title: "Weight & Balance Sheet",
                    description: "Calculate and document aircraft weight distribution and balance.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
                
                <DocumentCard
                  document={{
                    id: 5,
                    title: "Special Handling Form",
                    description: "Document special handling requirements for unusual cargo types or sensitive items.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
                
                <DocumentCard
                  document={{
                    id: 6,
                    title: "Aircraft Tie-Down Diagram",
                    description: "Detailed cargo restraint planning diagram with tie-down points and calculations.",
                    lastUpdated: new Date(),
                    type: "Form",
                    fields: {},
                    createdAt: new Date()
                  }}
                />
              </div>
            </TabsContent>
            
            {/* Phone Directory Tab */}
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
                ) : directories.length === 0 ? (
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
                    {directories.map((entry) => {
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
                                    onClick={() => toggleAirfieldExpansion(entry.id)}
                                    className="p-1 h-auto"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <div>
                                    <CardTitle className="text-lg">{entry.airbaseCode}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{entry.airbaseName}</p>
                                  </div>
                                </div>
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
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent>
                              <div className="space-y-3">
                                {entry.contacts.map((contact) => (
                                  <div key={contact.id} className="border-l-4 border-primary pl-4 py-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{contact.name}</h4>
                                        <p className="text-sm text-muted-foreground">{contact.description}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-mono text-sm">{contact.phoneNumber}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Add New Directory Entry Dialog */}
                <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Airbase Directory</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="airbaseCode">Airbase Code</Label>
                          <Input
                            id="airbaseCode"
                            placeholder="e.g., BNE"
                            value={newEntry.airbaseCode}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseCode: e.target.value.toUpperCase() }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="airbaseName">Airbase Name</Label>
                          <Input
                            id="airbaseName"
                            placeholder="e.g., Brisbane"
                            value={newEntry.airbaseName}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, airbaseName: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Contacts</Label>
                          <Button
                            type="button"
                            onClick={() => addContact(newEntry, setNewEntry)}
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                          </Button>
                        </div>

                        {newEntry.contacts.map((contact) => (
                          <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContact(newEntry, setNewEntry, contact.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  placeholder="e.g., Control Tower"
                                  value={contact.name}
                                  onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'name', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Phone Number</Label>
                                <Input
                                  placeholder="e.g., +61-7-3000-1234"
                                  value={contact.phoneNumber}
                                  onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'phoneNumber', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Input
                                  placeholder="e.g., Air traffic control"
                                  value={contact.description}
                                  onChange={(e) => updateContact(newEntry, setNewEntry, contact.id, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveNew} disabled={createMutation.isPending}>
                          {createMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Directory
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Directory Entry Dialog */}
                <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Airbase Directory</DialogTitle>
                    </DialogHeader>
                    {editingEntry && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="editAirbaseCode">Airbase Code</Label>
                            <Input
                              id="editAirbaseCode"
                              value={editingEntry.airbaseCode}
                              onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, airbaseCode: e.target.value.toUpperCase() }) : null)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="editAirbaseName">Airbase Name</Label>
                            <Input
                              id="editAirbaseName"
                              value={editingEntry.airbaseName}
                              onChange={(e) => setEditingEntry(prev => prev ? ({ ...prev, airbaseName: e.target.value }) : null)}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Contacts</Label>
                            <Button
                              type="button"
                              onClick={() => addContact(editingEntry, setEditingEntry)}
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Contact
                            </Button>
                          </div>

                          {editingEntry.contacts.map((contact) => (
                            <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContact(editingEntry, setEditingEntry, contact.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={contact.name}
                                    onChange={(e) => updateContact(editingEntry, setEditingEntry, contact.id, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Phone Number</Label>
                                  <Input
                                    value={contact.phoneNumber}
                                    onChange={(e) => updateContact(editingEntry, setEditingEntry, contact.id, 'phoneNumber', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input
                                    value={contact.description}
                                    onChange={(e) => updateContact(editingEntry, setEditingEntry, contact.id, 'description', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setEditingEntry(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
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
      </div>
    </div>
  );
}