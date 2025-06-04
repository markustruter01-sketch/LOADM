import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const queryClient = useQueryClient();

  const {
    data: directories = [],
    isLoading: directoryLoading,
    error: directoryError,
  } = useQuery({
    queryKey: ["/api/phone-directory"],
  });

  const createDirectoryMutation = useMutation({
    mutationFn: async (data: { airbaseCode: string; airbaseName: string }) => {
      const response = await apiRequest("/api/phone-directory", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-directory"] });
      setIsAddingNew(false);
      setNewEntryData({ airbaseCode: "", airbaseName: "" });
    },
  });

  const updateDirectoryMutation = useMutation({
    mutationFn: async (data: DirectoryEntry) => {
      const response = await apiRequest(`/api/phone-directory/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      return response;
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
      const entry = directories.find((d: DirectoryEntry) => d.id === entryId);
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
      const entry = directories.find((d: DirectoryEntry) => d.id === entryId);
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
      const entry = directories.find((d: DirectoryEntry) => d.id === entryId);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <Helmet>
        <title>Phone Directory | LOADM</title>
        <meta name="description" content="Access airbase contact information" />
      </Helmet>
      
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/")}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Phone Directory</h1>
            <p className="text-muted-foreground mt-2">
              Access airbase contact information
            </p>
          </div>
          
          {/* Phone Directory Content */}
          <div className="mt-6">
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
                  {directories.map((entry: DirectoryEntry) => {
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

              {/* Add New Directory Dialog */}
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

              {/* Edit Directory Dialog */}
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

              {/* Edit Contact Dialog */}
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
                            const entryId = directories.find((d: DirectoryEntry) => 
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
          </div>
        </div>
      </div>
    </div>
  );
}